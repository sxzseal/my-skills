import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { ok, err } from '@/lib/api-response'
import {
  listSummaries,
  deriveTags,
  filterSummaries,
  upsertSkill,
  ShaConflictError,
  type SkillSummary,
} from '@/lib/skills-store'
import {
  skillUpsertBodySchema,
  type SkillUpsertBody,
} from '@/features/skills/schemas'
import { resolveLocaleFromRequest } from '@/lib/locale'
import { requireAccessAuth, getAccessIdentity } from '@/lib/access-auth'
import { checkRateLimit } from '@/lib/rate-limit'

interface ListResponse {
  list: SkillSummary[]
  total: number
  tags: string[]
}

function clientKey(request: NextRequest): string {
  const identity = getAccessIdentity(request)
  if (identity?.email) return `email:${identity.email}`
  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() ?? ''
  return ip ? `ip:${ip}` : 'ip:unknown'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const tag = searchParams.get('tag') ?? ''

  const all = await listSummaries()
  const list = filterSummaries(all, { q, tag })
  const tags = deriveTags(all)

  return ok<ListResponse>({ list, total: list.length, tags })
}

export async function POST(request: NextRequest) {
  const authFailure = await requireAccessAuth(request)
  if (authFailure) return authFailure

  const locale = resolveLocaleFromRequest(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })

  if (!checkRateLimit(clientKey(request))) {
    return err(429, t('rateLimited'))
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err(400, t('invalidBody'))
  }

  const parsed = skillUpsertBodySchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue.path.join('.')
    const msg = path ? `${path}: ${issue.message}` : issue.message
    return err(400, msg)
  }

  const input: SkillUpsertBody = parsed.data
  const now = new Date().toISOString()

  try {
    const { detail, commitSha, isUpdate } = await upsertSkill(input, now)
    const buildId = `build-${now.replaceAll('-', '').replaceAll(':', '').replaceAll('.', '').slice(0, 15)}`
    return ok(
      {
        commitSha,
        buildId,
        message: isUpdate ? `Update skill: ${detail.name}` : `Add skill: ${detail.name}`,
        skill: detail,
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    if (error instanceof ShaConflictError) {
      return err(409, t('conflict'))
    }
    if (isAbortError(error)) {
      console.error('[POST /api/skills] upstream timeout:', error)
      return err(504, t('timeoutError'))
    }
    console.error('[POST /api/skills] unexpected error:', error)
    return err(500, t('serverError'))
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: unknown }).name
  return name === 'AbortError' || name === 'TimeoutError'
}
