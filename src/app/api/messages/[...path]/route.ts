export const dynamic = 'force-static'

const NOT_FOUND_BODY = JSON.stringify({
  status_code: 404,
  data: null,
  message: 'Not Found',
})

function notFound(): Response {
  return new Response(NOT_FOUND_BODY, {
    status: 404,
    headers: { 'content-type': 'application/json' },
  })
}

export function GET() {
  return notFound()
}

export function POST() {
  return notFound()
}
