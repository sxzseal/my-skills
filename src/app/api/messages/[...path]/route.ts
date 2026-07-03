export const dynamic = 'force-static'

const NOT_FOUND = new Response(
  JSON.stringify({ status_code: 404, data: null, message: 'Not Found' }),
  { status: 404, headers: { 'content-type': 'application/json' } },
)

export function GET() {
  return NOT_FOUND.clone()
}

export function POST() {
  return NOT_FOUND.clone()
}
