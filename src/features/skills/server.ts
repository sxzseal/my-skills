/**
 * My Skills — 服务端数据读取
 *
 * 供 server components (`app/[locale]/(hub)/**\/page.tsx`) 直接使用，绕过
 * `fetch('/api/skills')` 的 RSC 回环。类型与 `queries.ts` 单一来源共享。
 *
 * ⚠️ 只能在 server components 里 import；client component 应继续用
 * `queries.ts` 的 fetch-based 版本（当前无使用，为将来接 TanStack Query 预留）。
 */
import {
  listSummaries,
  listTags,
  getDetail,
  getBuildStatus,
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
  const q = (params.q ?? '').toLowerCase().trim()
  const tag = (params.tag ?? '').trim()

  let list = await listSummaries()
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
  }
  if (tag) {
    list = list.filter((s) => s.tags.includes(tag))
  }
  return { list, total: list.length, tags: await listTags() }
}

export async function getSkillDetailServer(name: string): Promise<SkillDetail | null> {
  return await getDetail(name)
}

export async function getBuildStatusServer(
  buildId: string | null,
): Promise<BuildStatusResponse> {
  return getBuildStatus(buildId)
}
