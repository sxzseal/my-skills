import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { ok, err } from '@/lib/api-response'
import {
  listSummaries,
  listTags,
  upsertSkill,
  ShaConflictError,
  type SkillSummary,
} from '@/lib/skills-store'
import {
  skillUpsertBodySchema,
  type SkillUpsertBody,
} from '@/features/skills/schemas'
import { routing } from '@/i18n/routing'
import { requireAccessAuth } from '@/lib/access-auth'

function resolveLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale
  }
  const accept = request.headers.get('accept-language') ?? ''
  const preferred = accept.split(',')[0]?.trim().toLowerCase() ?? ''
  const match = (routing.locales as readonly string[]).find(
    (l) => preferred === l.toLowerCase() || preferred.startsWith(l.toLowerCase() + '-'),
  )
  return match ?? routing.defaultLocale
}

interface ListResponse {
  list: SkillSummary[]
  total: number
  tags: string[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').toLowerCase().trim()
  const tag = (searchParams.get('tag') ?? '').trim()

  let list = await listSummaries()
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
  }
  if (tag) {
    list = list.filter((s) => s.tags.includes(tag))
  }

  return ok<ListResponse>({ list, total: list.length, tags: await listTags() })
}

export async function POST(request: NextRequest) {
  const authFailure = await requireAccessAuth(request)
  if (authFailure) return authFailure

  const locale = resolveLocale(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })

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
    console.error('[POST /api/skills] unexpected error:', error)
    const message = error instanceof Error ? error.message : 'unknown error'
    return err(500, t('serverError', { message }))
  }
}
