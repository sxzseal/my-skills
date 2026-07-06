import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

const verifyCfAccessJwt = vi.fn()
const cfAccessJwtConfigured = vi.fn()

vi.mock('@/lib/cf-access-jwt', () => ({
  verifyCfAccessJwt: (t: string) => verifyCfAccessJwt(t),
  cfAccessJwtConfigured: () => cfAccessJwtConfigured(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => `t:${key}`,
}))

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
    cookies: {
      get: () => undefined,
    },
  } as unknown as NextRequest
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  verifyCfAccessJwt.mockReset()
  cfAccessJwtConfigured.mockReset().mockReturnValue(false)
  vi.resetModules()
  // Clear all Access-related env vars for a clean slate.
  const env = process.env as Record<string, string | undefined>
  delete env.ACCESS_AUTH_ENABLED
  delete env.NODE_ENV
  delete env.CF_ACCESS_TEAM_DOMAIN
  delete env.CF_ACCESS_AUD
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

async function loadAccessAuth() {
  return await import('@/lib/access-auth')
}

describe('requireAccessAuth · presence-only mode', () => {
  beforeEach(() => {
    process.env.ACCESS_AUTH_ENABLED = 'true'
    cfAccessJwtConfigured.mockReturnValue(false)
  })

  it('returns 401 envelope when both headers are missing', async () => {
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(makeRequest())
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    const body = await res!.json()
    expect(body).toEqual({
      status_code: 401,
      message: 't:unauthorized',
      data: null,
    })
  })

  it('passes when only jwt header is present', async () => {
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(
      makeRequest({ 'cf-access-jwt-assertion': 'anything' }),
    )
    expect(res).toBeNull()
  })

  it('passes when only email header is present', async () => {
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(
      makeRequest({ 'cf-access-authenticated-user-email': 'u@x.com' }),
    )
    expect(res).toBeNull()
  })
})

describe('requireAccessAuth · toggle logic', () => {
  it('ACCESS_AUTH_ENABLED=false in production → passes', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    process.env.ACCESS_AUTH_ENABLED = 'false'
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(makeRequest())
    expect(res).toBeNull()
  })

  it('unset + NODE_ENV=production → enabled (401 without headers)', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(makeRequest())
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
  })

  it('unset + NODE_ENV=development → disabled (passes)', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(makeRequest())
    expect(res).toBeNull()
  })
})

describe('requireAccessAuth · JWT verify mode', () => {
  beforeEach(() => {
    process.env.ACCESS_AUTH_ENABLED = 'true'
    cfAccessJwtConfigured.mockReturnValue(true)
  })

  it('401s when jwt header is missing', async () => {
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(makeRequest())
    expect(res!.status).toBe(401)
    expect(verifyCfAccessJwt).not.toHaveBeenCalled()
  })

  it('401s when jose fails to verify', async () => {
    verifyCfAccessJwt.mockResolvedValueOnce(null)
    const { requireAccessAuth } = await loadAccessAuth()
    const res = await requireAccessAuth(
      makeRequest({ 'cf-access-jwt-assertion': 'bad-token' }),
    )
    expect(res!.status).toBe(401)
    expect(verifyCfAccessJwt).toHaveBeenCalledWith('bad-token')
  })

  it('passes when jose verifies and attaches identity', async () => {
    verifyCfAccessJwt.mockResolvedValueOnce({ email: 'u@x.com', sub: 'sub-1' })
    const { requireAccessAuth, getAccessIdentity } = await loadAccessAuth()
    const request = makeRequest({ 'cf-access-jwt-assertion': 'good-token' })
    const res = await requireAccessAuth(request)
    expect(res).toBeNull()
    expect(getAccessIdentity(request)).toEqual({ email: 'u@x.com', sub: 'sub-1' })
  })
})
