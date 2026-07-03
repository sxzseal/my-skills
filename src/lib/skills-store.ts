/**
 * Skills store — GitHub-backed persistence.
 *
 * Reads happen from the local filesystem (skills/<name>/SKILL.md), which is
 * bundled into the Vercel deployment. Writes go through the GitHub Contents
 * API using a single admin token; each mutation becomes a commit, which
 * triggers a Vercel rebuild automatically.
 */
import matter from 'gray-matter'
import { z } from 'zod'
import type {
  SkillSummary,
  SkillDetail,
  BuildStatusResponse,
} from '@/features/skills/queries'
import {
  listSkillDirs,
  readSkillFile,
  computeBlobSha,
  skillRepoPath,
} from './skill-fs'
import {
  getOctokit,
  getRepoConfig,
  SkillFileConflictError,
  isConflictError,
} from './github-client'

export type { SkillSummary, SkillDetail } from '@/features/skills/queries'
export type BuildStatus = BuildStatusResponse

const frontmatterSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

type Frontmatter = z.infer<typeof frontmatterSchema>

interface ParsedSkill {
  frontmatter: Frontmatter
  content: string
  frontmatterRaw: string
  sha: string
  sizeBytes: number
}

function coerceDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return undefined
}

function extractFrontmatterRaw(source: string): string {
  const trimmed = source.replace(/^﻿/, '')
  if (!trimmed.startsWith('---')) return ''
  const end = trimmed.indexOf('\n---', 3)
  if (end === -1) return ''
  return trimmed.slice(4, end).trim()
}

async function parseSkill(name: string): Promise<ParsedSkill | null> {
  const file = await readSkillFile(name)
  if (!file) return null
  const parsed = matter(file.raw)
  const dataInput = {
    ...parsed.data,
    createdAt: coerceDate((parsed.data as Record<string, unknown>).createdAt),
    updatedAt: coerceDate((parsed.data as Record<string, unknown>).updatedAt),
  }
  const result = frontmatterSchema.safeParse(dataInput)
  if (!result.success) {
    console.warn(
      `[skills-store] skipping ${name}: invalid frontmatter — ${result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    )
    return null
  }
  return {
    frontmatter: result.data,
    content: parsed.content.replace(/^\n+/, ''),
    frontmatterRaw: extractFrontmatterRaw(file.raw),
    sha: file.sha,
    sizeBytes: file.sizeBytes,
  }
}

function toSummary(p: ParsedSkill): SkillSummary {
  return {
    name: p.frontmatter.name,
    displayName: p.frontmatter.displayName,
    description: p.frontmatter.description,
    version: p.frontmatter.version,
    tags: [...p.frontmatter.tags],
    createdAt: p.frontmatter.createdAt,
    updatedAt: p.frontmatter.updatedAt,
    sha: p.sha,
    sizeBytes: p.sizeBytes,
  }
}

function toDetail(p: ParsedSkill): SkillDetail {
  return {
    ...toSummary(p),
    content: p.content,
    frontmatterRaw: p.frontmatterRaw,
  }
}

export async function listSummaries(): Promise<SkillSummary[]> {
  const dirs = await listSkillDirs()
  const parsed = await Promise.all(dirs.map((d) => parseSkill(d)))
  return parsed.filter((p): p is ParsedSkill => p !== null).map(toSummary)
}

export async function listTags(): Promise<string[]> {
  const summaries = await listSummaries()
  const set = new Set<string>()
  for (const s of summaries) for (const t of s.tags) set.add(t)
  return Array.from(set).sort()
}

export async function getDetail(name: string): Promise<SkillDetail | null> {
  const parsed = await parseSkill(name)
  if (!parsed) return null
  return toDetail(parsed)
}

export async function hasSkill(name: string): Promise<boolean> {
  const file = await readSkillFile(name)
  return file !== null
}

export interface UpsertInput {
  name: string
  displayName: string
  description: string
  version: string
  tags: string[]
  content: string
  sha?: string
}

export interface UpsertResult {
  detail: SkillDetail
  commitSha: string
  isUpdate: boolean
}

export class ShaConflictError extends Error {
  constructor(message = 'SHA conflict') {
    super(message)
    this.name = 'ShaConflictError'
  }
}

function buildMarkdown(input: UpsertInput, createdAt: string, updatedAt: string): string {
  const data: Frontmatter = {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    version: input.version,
    tags: [...input.tags],
    createdAt,
    updatedAt,
  }
  const body = input.content.endsWith('\n') ? input.content : `${input.content}\n`
  return matter.stringify(body, data)
}

export async function upsertSkill(
  input: UpsertInput,
  nowIso: string,
): Promise<UpsertResult> {
  const existing = await parseSkill(input.name)
  const isUpdate = existing !== null

  if (isUpdate && existing && input.sha && input.sha !== existing.sha) {
    throw new ShaConflictError()
  }

  const createdAt = existing?.frontmatter.createdAt ?? nowIso
  const markdown = buildMarkdown(input, createdAt, nowIso)
  const contentB64 = Buffer.from(markdown, 'utf8').toString('base64')

  const octokit = getOctokit()
  const { owner, repo, branch } = getRepoConfig()

  let commitSha: string
  try {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      branch,
      path: skillRepoPath(input.name),
      message: `${isUpdate ? 'Update' : 'Add'} skill: ${input.name}`,
      content: contentB64,
      sha: existing?.sha,
    })
    commitSha = res.data.commit.sha ?? ''
  } catch (err: unknown) {
    if (err instanceof SkillFileConflictError || isConflictError(err)) {
      throw new ShaConflictError()
    }
    throw err
  }

  const newSha = computeBlobSha(markdown)
  const sizeBytes = Buffer.byteLength(markdown, 'utf8')

  const detail: SkillDetail = {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    version: input.version,
    tags: [...input.tags],
    createdAt,
    updatedAt: nowIso,
    sha: newSha,
    sizeBytes,
    content: input.content.replace(/^\n+/, ''),
    frontmatterRaw: extractFrontmatterRaw(markdown),
  }

  return { detail, commitSha, isUpdate }
}

export async function deleteSkill(
  name: string,
): Promise<{ commitSha: string } | null> {
  const existing = await parseSkill(name)
  if (!existing) return null

  const octokit = getOctokit()
  const { owner, repo, branch } = getRepoConfig()

  try {
    const res = await octokit.repos.deleteFile({
      owner,
      repo,
      branch,
      path: skillRepoPath(name),
      message: `Delete skill: ${name}`,
      sha: existing.sha,
    })
    return { commitSha: res.data.commit.sha ?? '' }
  } catch (err: unknown) {
    if (isConflictError(err)) throw new ShaConflictError()
    throw err
  }
}

export function getBuildStatus(buildId: string | null): BuildStatus {
  if (buildId === 'build-success') {
    return {
      status: 'success',
      startedAt: '2026-07-02T10:31:00Z',
      completedAt: '2026-07-02T10:31:47Z',
      url: 'https://my-skills.pages.dev',
      buildId,
    }
  }
  return {
    status: 'building',
    startedAt: new Date(0).toISOString(),
    buildId: buildId ?? 'build-unknown',
  }
}
