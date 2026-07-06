/**
 * Cloudflare Access defense-in-depth guard.
 *
 * The app sits behind Cloudflare Access. CFA injects:
 *   - `Cf-Access-Jwt-Assertion` — signed JWT
 *   - `Cf-Access-Authenticated-User-Email` — resolved user email
 *
 * When `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are set we cryptographically
 * verify the JWT against Cloudflare's JWKS — this is the required production
 * posture, because the origin (Vercel deploy URL) is reachable independent of
 * the CFA tunnel and header presence alone is trivial to spoof.
 *
 * If those envs are absent we fall back to a presence-only check and warn on
 * first use — safe for local development where CFA is not in the loop.
 *
 * Env:
 *   - `ACCESS_AUTH_ENABLED=true|false`  toggle (default: on in production)
 *   - `CF_ACCESS_TEAM_DOMAIN`           e.g. "myorg.cloudflareaccess.com"
 *   - `CF_ACCESS_AUD`                   Application Audience tag
 */
import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { err } from './api-response'
import { resolveLocaleFromRequest } from './locale'
import { cfAccessJwtConfigured, verifyCfAccessJwt } from './cf-access-jwt'

const HEADER_JWT = 'cf-access-jwt-assertion'
const HEADER_EMAIL = 'cf-access-authenticated-user-email'

function isEnabled(): boolean {
  const flag = process.env.ACCESS_AUTH_ENABLED
  if (flag === 'true') return true
  if (flag === 'false') return false
  return process.env.NODE_ENV === 'production'
}

let warnedAboutFallback = false
function warnFallbackOnce() {
  if (warnedAboutFallback) return
  warnedAboutFallback = true
  console.warn(
    '[access-auth] CF Access JWT verification NOT configured (missing CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD). Falling back to presence-only check — do not use in production.',
  )
}

async function unauthorized(request: NextRequest): Promise<Response> {
  const locale = resolveLocaleFromRequest(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })
  return err(401, t('unauthorized'))
}

export interface AccessAuthResult {
  identity: { email: string; sub: string } | null
}

/**
 * Returns null (with identity attached to a WeakMap for callers via
 * `getAccessIdentity`) when authorized, or a Response when the request
 * should be rejected. Callers should return the Response immediately.
 */
export async function requireAccessAuth(
  request: NextRequest,
): Promise<Response | null> {
  if (!isEnabled()) return null

  const jwt = request.headers.get(HEADER_JWT)
  const email = request.headers.get(HEADER_EMAIL)

  if (cfAccessJwtConfigured()) {
    if (!jwt) return unauthorized(request)
    const identity = await verifyCfAccessJwt(jwt)
    if (!identity) return unauthorized(request)
    identityCache.set(request, identity)
    return null
  }

  warnFallbackOnce()
  if (!jwt && !email) return unauthorized(request)
  return null
}

const identityCache = new WeakMap<NextRequest, { email: string; sub: string }>()

export function getAccessIdentity(
  request: NextRequest,
): { email: string; sub: string } | null {
  return identityCache.get(request) ?? null
}
