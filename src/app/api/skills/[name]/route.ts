import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { ok, err } from '@/lib/api-response'
import { getDetail, deleteSkill, ShaConflictError } from '@/lib/skills-store'
import { nameRegex } from '@/features/skills/schemas'
import { resolveLocaleFromRequest } from '@/lib/locale'
import { requireAccessAuth, getAccessIdentity } from '@/lib/access-auth'
import { checkRateLimit } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ name: string }>
}

function clientKey(request: NextRequest): string {
  const identity = getAccessIdentity(request)
  if (identity?.email) return `email:${identity.email}`
  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() ?? ''
  return ip ? `ip:${ip}` : 'ip:unknown'
}

async function notFoundResponse(request: NextRequest) {
  const locale = resolveLocaleFromRequest(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })
  return err(404, t('notFound'))
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { name } = await context.params
  if (!nameRegex.test(name) || name.length > 64) {
    return notFoundResponse(request)
  }
  const detail = await getDetail(name)
  if (!detail) return notFoundResponse(request)
  return ok(detail)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authFailure = await requireAccessAuth(request)
  if (authFailure) return authFailure

  const locale = resolveLocaleFromRequest(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })

  if (!checkRateLimit(clientKey(request))) {
    return err(429, t('rateLimited'))
  }

  const { name } = await context.params
  if (!nameRegex.test(name) || name.length > 64) {
    return notFoundResponse(request)
  }

  try {
    const result = await deleteSkill(name)
    if (!result) return notFoundResponse(request)
    return ok(result)
  } catch (error: unknown) {
    if (error instanceof ShaConflictError) {
      return err(409, t('conflict'))
    }
    if (isAbortError(error)) {
      console.error(`[DELETE /api/skills/${name}] upstream timeout:`, error)
      return err(504, t('timeoutError'))
    }
    console.error(`[DELETE /api/skills/${name}] unexpected error:`, error)
    return err(500, t('serverError'))
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: unknown }).name
  return name === 'AbortError' || name === 'TimeoutError'
}
