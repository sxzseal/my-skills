'use client'
import { request, RequestError } from '@/lib/request'
import type {
  DeleteResponse,
  UpsertResponse,
} from './queries'

/**
 * My Skills — 客户端写操作
 *
 * v1 未装 TanStack Query，暂时不提供 useMutation hooks。
 * 未来接入 @tanstack/react-query 时，在此文件补 useUpsertSkill / useDeleteSkill。
 */

export interface UpsertSkillBody {
  name: string
  displayName: string
  description: string
  version: string
  tags: string[]
  content: string
  sha?: string
}

export async function upsertSkillRequest(body: UpsertSkillBody): Promise<UpsertResponse> {
  return request<UpsertResponse>('/api/skills', {
    method: 'POST',
    body,
  })
}

export async function deleteSkillRequest(name: string): Promise<DeleteResponse> {
  return request<DeleteResponse>(`/api/skills/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
}

export { RequestError }
