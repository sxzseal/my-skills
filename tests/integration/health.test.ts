import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns success envelope with full shape', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status_code).toBe(0)
    expect(body.data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
      version: expect.any(String),
    })
    const parsed = new Date(body.data.timestamp)
    expect(parsed.toString()).not.toBe('Invalid Date')
    expect(body.data.version.length).toBeGreaterThan(0)
  })
})
