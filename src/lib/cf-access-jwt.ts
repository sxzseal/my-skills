/**
 * Cloudflare Access JWT verification.
 *
 * When `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are configured, we verify the
 * `Cf-Access-Jwt-Assertion` header against Cloudflare's team JWK set. JWKS
 * fetches are memoized by `jose` internally, so repeated verifications are
 * cheap.
 *
 * Env:
 *   - `CF_ACCESS_TEAM_DOMAIN`  e.g. "myorg.cloudflareaccess.com"
 *   - `CF_ACCESS_AUD`          the Application Audience tag from the CFA policy
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

interface Config {
  teamDomain: string
  audience: string
}

function readConfig(): Config | null {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim()
  const audience = process.env.CF_ACCESS_AUD?.trim()
  if (!teamDomain || !audience) return null
  return { teamDomain, audience }
}

export function cfAccessJwtConfigured(): boolean {
  return readConfig() !== null
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null
let cachedFor: string | null = null

function getJwks(cfg: Config) {
  if (cachedJwks && cachedFor === cfg.teamDomain) return cachedJwks
  const url = new URL(`https://${cfg.teamDomain}/cdn-cgi/access/certs`)
  cachedJwks = createRemoteJWKSet(url)
  cachedFor = cfg.teamDomain
  return cachedJwks
}

export interface CfAccessIdentity {
  email: string
  sub: string
}

export async function verifyCfAccessJwt(
  token: string,
): Promise<CfAccessIdentity | null> {
  const cfg = readConfig()
  if (!cfg) return null
  try {
    const { payload } = await jwtVerify(token, getJwks(cfg), {
      issuer: `https://${cfg.teamDomain}`,
      audience: cfg.audience,
    })
    return toIdentity(payload)
  } catch {
    return null
  }
}

function toIdentity(payload: JWTPayload): CfAccessIdentity | null {
  const email = typeof payload.email === 'string' ? payload.email : ''
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  if (!email && !sub) return null
  return { email, sub }
}
