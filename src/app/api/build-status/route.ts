import type { NextRequest } from 'next/server'
import { ok } from '@/lib/api-response'
import { getBuildStatus } from '@/lib/skills-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buildId = searchParams.get('buildId')
  return ok(getBuildStatus(buildId))
}
