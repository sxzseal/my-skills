import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { ok, err } from '@/lib/api-response'
import { getDetail, deleteSkill } from '@/lib/skills-store'
import { routing } from '@/i18n/routing'
import { nameRegex } from '@/features/skills/schemas'
import { requireAccessAuth } from '@/lib/access-auth'

interface RouteContext {
  params: Promise<{ name: string }>
}

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

async function notFoundResponse(request: NextRequest) {
  const locale = resolveLocale(request)
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

  const { name } = await context.params
  if (!nameRegex.test(name) || name.length > 64) {
    return notFoundResponse(request)
  }
  const result = await deleteSkill(name)
  if (!result) return notFoundResponse(request)
  return ok(result)
}
