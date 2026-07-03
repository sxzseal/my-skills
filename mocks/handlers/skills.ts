import { http, HttpResponse, delay } from 'msw'
import {
  SKILL_LIST,
  SKILL_DETAILS,
  SKILL_TAGS,
  BUILD_STATUS_BUILDING,
  BUILD_STATUS_SUCCESS,
} from '../fixtures/skills'

export const skillsHandlers = [
  http.get('/api/skills', async ({ request }) => {
    await delay(240)
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const tag = url.searchParams.get('tag') ?? ''
    let list = SKILL_LIST
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.displayName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }
    if (tag) list = list.filter((s) => s.tags.includes(tag))
    return HttpResponse.json({
      status_code: 0,
      data: { list, total: list.length, tags: SKILL_TAGS },
    })
  }),

  http.get('/api/skills/:name', async ({ params }) => {
    await delay(200)
    const name = String(params.name)
    const detail = SKILL_DETAILS[name]
    if (!detail) {
      return HttpResponse.json(
        { status_code: 404, data: null, message: `skill ${name} not found` },
        { status: 404 },
      )
    }
    return HttpResponse.json({ status_code: 0, data: detail })
  }),

  http.post('/api/skills', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as Record<string, unknown>
    if (!body.name || !body.displayName || !body.content) {
      return HttpResponse.json(
        {
          status_code: 400,
          data: null,
          message: 'name / displayName / content are required',
        },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      {
        status_code: 0,
        data: {
          commitSha: 'newsha' + Math.random().toString(16).slice(2, 10),
          buildId: 'build-20260702-002',
          message: `Update skill: ${String(body.name)}`,
        },
      },
      { status: 201 },
    )
  }),

  http.delete('/api/skills/:name', async ({ params }) => {
    await delay(200)
    const name = String(params.name)
    if (!SKILL_DETAILS[name] && !SKILL_LIST.find((s) => s.name === name)) {
      return HttpResponse.json(
        { status_code: 404, data: null, message: `skill ${name} not found` },
        { status: 404 },
      )
    }
    return HttpResponse.json({
      status_code: 0,
      data: { commitSha: 'delsha' + Math.random().toString(16).slice(2, 10) },
    })
  }),

  http.get('/api/build-status', async ({ request }) => {
    await delay(150)
    const url = new URL(request.url)
    const buildId = url.searchParams.get('buildId')
    if (buildId === 'build-success') {
      return HttpResponse.json({ status_code: 0, data: BUILD_STATUS_SUCCESS })
    }
    return HttpResponse.json({ status_code: 0, data: BUILD_STATUS_BUILDING })
  }),
]
