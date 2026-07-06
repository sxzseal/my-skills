import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'

/**
 * Resolve the response locale for API/middleware code paths.
 * Precedence: `NEXT_LOCALE` cookie > first entry in accept-language > default.
 */
export function resolveLocaleFromRequest(request: NextRequest): string {
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
