/**
 * My Skills — server-side data loaders.
 *
 * Intended for server components (`app/[locale]/(hub)/**\/page.tsx`); bypasses
 * the `fetch('/api/skills')` round-trip. Types are the single source of truth
 * in `queries.ts`.
 *
 * WARNING: server-components only. Client components should keep using the
 * fetch-based mutations from `mutations.ts`.
 */
import {
  listSummaries,
  deriveTags,
  filterSummaries,
  getDetail,
  getBuildStatusStub,
} from '@/lib/skills-store'
import type {
  SkillDetail,
  SkillListResponse,
  BuildStatusResponse,
  ListSkillsParams,
} from './queries'

export async function getSkillListServer(
  params: ListSkillsParams = {},
): Promise<SkillListResponse> {
  const all = await listSummaries()
  const list = filterSummaries(all, params)
  const tags = deriveTags(all)
  return { list, total: list.length, tags }
}

export async function getSkillDetailServer(name: string): Promise<SkillDetail | null> {
  return await getDetail(name)
}

export async function getBuildStatusServer(
  buildId: string | null,
): Promise<BuildStatusResponse> {
  return getBuildStatusStub(buildId)
}
