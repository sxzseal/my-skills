import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { createSkillSummary, createSkillDetail } from '../helpers/fixtures'

const listSummaries = vi.fn()
const upsertSkill = vi.fn()
const requireAccessAuth = vi.fn()
const checkRateLimit = vi.fn().mockReturnValue(true)

vi.mock('@/lib/skills-store', async () => {
  const actual = await vi.importActual<typeof import('@/lib/skills-store')>(
    '@/lib/skills-store',
  )
  return {
    ...actual,
    listSummaries: () => listSummaries(),
    upsertSkill: (input: unknown, now: string) => upsertSkill(input, now),
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

function makeGetRequest(url: string): NextRequest {
  return {
    url,
    headers: { get: () => null },
    cookies: { get: () => undefined },
  } as unknown as NextRequest
}

function makePostRequest(body: unknown, opts?: { rawJsonError?: boolean }): NextRequest {
  return {
    url: 'http://localhost/api/skills',
    headers: { get: (k: string) => (k === 'x-forwarded-for' ? '1.2.3.4' : null) },
    cookies: { get: () => undefined },
    json: async () => {
      if (opts?.rawJsonError) throw new Error('bad json')
      return body
    },
  } as unknown as NextRequest
}

beforeEach(() => {
  listSummaries.mockReset()
  upsertSkill.mockReset()
  requireAccessAuth.mockReset().mockResolvedValue(null)
  checkRateLimit.mockReset().mockReturnValue(true)
})

afterEach(() => {
  vi.resetModules()
})

describe('GET /api/skills', () => {
  it('returns envelope with list + tags', async () => {
    listSummaries.mockResolvedValueOnce([
      createSkillSummary({ name: 'alpha', tags: ['prod'] }),
      createSkillSummary({ name: 'beta', tags: ['test'] }),
    ])
    const { GET } = await import('@/app/api/skills/route')
    const res = await GET(makeGetRequest('http://localhost/api/skills'))
    const body = await res.json()
    expect(body.status_code).toBe(0)
    expect(body.data.list).toHaveLength(2)
    expect(body.data.tags).toEqual(['prod', 'test'])
  })

  it('filters by q', async () => {
    listSummaries.mockResolvedValueOnce([
      createSkillSummary({ name: 'copywriting', displayName: 'Copywriting' }),
      createSkillSummary({ name: 'seo', displayName: 'SEO' }),
    ])
    const { GET } = await import('@/app/api/skills/route')
    const res = await GET(makeGetRequest('http://localhost/api/skills?q=seo'))
    const body = await res.json()
    expect(body.data.list).toHaveLength(1)
    expect(body.data.list[0].name).toBe('seo')
  })

  it('filters by tag', async () => {
    listSummaries.mockResolvedValueOnce([
      createSkillSummary({ name: 'a', tags: ['x'] }),
      createSkillSummary({ name: 'b', tags: ['y'] }),
    ])
    const { GET } = await import('@/app/api/skills/route')
    const res = await GET(makeGetRequest('http://localhost/api/skills?tag=y'))
    const body = await res.json()
    expect(body.data.list).toHaveLength(1)
    expect(body.data.list[0].name).toBe('b')
  })
})

describe('POST /api/skills', () => {
  const validBody = {
    name: 'new-skill',
    displayName: 'New',
    description: 'x',
    version: '0.1.0',
    tags: [],
    content: '# hi\n',
  }

  it('401s when auth fails', async () => {
    requireAccessAuth.mockResolvedValueOnce(
      new Response(JSON.stringify({ status_code: 401 }), { status: 401 }),
    )
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('429s when rate limit exceeded', async () => {
    checkRateLimit.mockReturnValueOnce(false)
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.status_code).toBe(429)
    expect(body.message).toContain('rateLimited')
  })

  it('400s on malformed JSON', async () => {
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(null, { rawJsonError: true }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('invalidBody')
  })

  it('400s on invalid name with field-prefixed message', async () => {
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest({ ...validBody, name: 'InvalidName' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/^name: /)
  })

  it('409s on ShaConflictError', async () => {
    const { ShaConflictError } = await import('@/lib/skills-store')
    upsertSkill.mockRejectedValueOnce(new ShaConflictError())
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(409)
  })

  it('500s on unexpected error, without leaking message', async () => {
    upsertSkill.mockRejectedValueOnce(
      new Error('/var/task/skills/foo/SKILL.md ENOENT'),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).not.toContain('/var/task')
    expect(body.message).not.toContain('ENOENT')
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('504s on Octokit AbortError', async () => {
    upsertSkill.mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'AbortError' }),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(504)
    errorSpy.mockRestore()
  })

  it('201s on success with buildId + commitSha + skill envelope', async () => {
    upsertSkill.mockResolvedValueOnce({
      detail: createSkillDetail({ name: 'new-skill' }),
      commitSha: 'commit-abc',
      isUpdate: false,
    })
    const { POST } = await import('@/app/api/skills/route')
    const res = await POST(makePostRequest(validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.commitSha).toBe('commit-abc')
    expect(body.data.buildId).toMatch(/^build-\d/)
    expect(body.data.skill.name).toBe('new-skill')
    expect(body.data.message).toBe('Add skill: new-skill')
  })
})
