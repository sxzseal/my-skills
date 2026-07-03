/**
 * My Skills — 共享类型
 *
 * 类型定义是本 feature module 的单一来源，被 `server.ts`（服务端数据读取）、
 * `mutations.ts`（客户端写入）、`skills-store.ts`（数据仓库）共享。
 *
 * v1 未装 TanStack Query。将来引入时，在此文件追加 `queryOptions` 工厂即可。
 */

export interface SkillSummary {
  name: string
  displayName: string
  description: string
  version: string
  tags: string[]
  createdAt: string
  updatedAt: string
  sha: string
  sizeBytes: number
}

export interface SkillDetail extends SkillSummary {
  content: string
  frontmatterRaw: string
}

export interface SkillListResponse {
  list: SkillSummary[]
  total: number
  tags: string[]
}

export interface UpsertResponse {
  commitSha: string
  buildId: string
  message: string
  skill: SkillDetail
}

export interface DeleteResponse {
  commitSha: string
}

export interface BuildStatusResponse {
  status: 'queued' | 'building' | 'success' | 'failed'
  startedAt: string
  completedAt?: string
  url?: string
  buildId: string
}

export interface ListSkillsParams {
  q?: string
  tag?: string
}
