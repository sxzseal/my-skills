import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { createSkillDetail } from '../helpers/fixtures'

const getDetail = vi.fn()
const deleteSkill = vi.fn()
const requireAccessAuth = vi.fn()
const checkRateLimit = vi.fn().mockReturnValue(true)

vi.mock('@/lib/skills-store', async () => {
  const actual = await vi.importActual<typeof import('@/lib/skills-store')>(
    '@/lib/skills-store',
  )
  return {
    ...actual,
    getDetail: (name: string) => getDetail(name),
    deleteSkill: (name: string) => deleteSkill(name),
  }
})

vi.mock('@/lib/access-auth', () => ({
  requireAccessAuth: (request: NextRequest) => requireAccessAuth(request),
  getAccessIdentity: () => null,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => checkRateLimit(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => `t:${key}`,
}))

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    url: 'http://localhost/api/skills/foo',
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
    cookies: { get: () => undefined },
  } as unknown as NextRequest
}

function makeCtx(name: string) {
  return { params: Promise.resolve({ name }) }
}

beforeEach(() => {
  getDetail.mockReset()
  deleteSkill.mockReset()
  requireAccessAuth.mockReset().mockResolvedValue(null)
  checkRateLimit.mockReset().mockReturnValue(true)
})

afterEach(() => {
  vi.resetModules()
})

describe('GET /api/skills/[name]', () => {
  it('returns 404 for invalid name', async () => {
    const { GET } = await import('@/app/api/skills/[name]/route')
    const res = await GET(makeRequest(), makeCtx('Bad Name!'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when skill not found', async () => {
    getDetail.mockResolvedValueOnce(null)
    const { GET } = await import('@/app/api/skills/[name]/route')
    const res = await GET(makeRequest(), makeCtx('missing'))
    expect(res.status).toBe(404)
  })

  it('returns detail on success', async () => {
    getDetail.mockResolvedValueOnce(createSkillDetail({ name: 'foo' }))
    const { GET } = await import('@/app/api/skills/[name]/route')
    const res = await GET(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('foo')
  })
})

describe('DELETE /api/skills/[name]', () => {
  it('401s when auth fails', async () => {
    requireAccessAuth.mockResolvedValueOnce(
      new Response(JSON.stringify({ status_code: 401 }), { status: 401 }),
    )
    const { DELETE } = await import('@/app/api/skills/[name]/route')
    const res = await DELETE(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(401)
  })

  it('429s when rate limited', async () => {
    checkRateLimit.mockReturnValueOnce(false)
    const { DELETE } = await import('@/app/api/skills/[name]/route')
    const res = await DELETE(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(429)
  })

  it('404s when skill does not exist', async () => {
    deleteSkill.mockResolvedValueOnce(null)
    const { DELETE } = await import('@/app/api/skills/[name]/route')
    const res = await DELETE(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(404)
  })

  it('409s on ShaConflictError', async () => {
    const { ShaConflictError } = await import('@/lib/skills-store')
    deleteSkill.mockRejectedValueOnce(new ShaConflictError())
    const { DELETE } = await import('@/app/api/skills/[name]/route')
    const res = await DELETE(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(409)
  })

  it('200s on successful delete', async () => {
    deleteSkill.mockResolvedValueOnce({ commitSha: 'commit-del' })
    const { DELETE } = await import('@/app/api/skills/[name]/route')
    const res = await DELETE(makeRequest(), makeCtx('foo'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.commitSha).toBe('commit-del')
  })
})
