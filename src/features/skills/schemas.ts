/**
 * My Skills — Zod schemas
 *
 * 同时用于表单校验 (react-hook-form + zodResolver) 和 API 请求体校验。
 * 表单 tags 用逗号分隔字符串；API body tags 是 string[]（在提交前转换）。
 */
import { z } from 'zod'

export const nameRegex = /^[a-z][a-z0-9-]*$/
export const versionRegex = /^\d+\.\d+\.\d+([.-][\w.-]+)?$/

/** 表单层：与前端表单字段对齐（tags 为字符串） */
export const skillFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'name.required' })
    .regex(nameRegex, { message: 'name.pattern' }),
  displayName: z.string().min(1, { message: 'displayName.required' }),
  description: z
    .string()
    .min(1, { message: 'description.required' })
    .max(200, { message: 'description.max' }),
  version: z.string().regex(versionRegex, { message: 'version.pattern' }),
  tags: z.string(),
})

export type SkillFormValues = z.infer<typeof skillFormSchema>

/** API 层：POST /api/skills 请求体 */
export const skillUpsertBodySchema = z.object({
  name: z.string().min(1).max(64).regex(nameRegex),
  displayName: z.string().min(1).max(120),
  description: z.string().min(1).max(200),
  version: z.string().max(40).regex(versionRegex),
  tags: z.array(z.string().min(1).max(32)).max(20).optional().default([]),
  content: z.string().min(1).max(262_144),
  sha: z.string().max(64).optional(),
})

export type SkillUpsertBody = z.infer<typeof skillUpsertBodySchema>

/** 把表单 tags 字符串转换成 string[]，去空、去重、trim */
export function parseTagsInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    ),
  )
}
