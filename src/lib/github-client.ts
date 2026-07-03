import { Octokit } from '@octokit/rest'

const OWNER_ENV = 'GITHUB_OWNER'
const REPO_ENV = 'GITHUB_REPO'
const BRANCH_ENV = 'GITHUB_BRANCH'
const TOKEN_ENV = 'GITHUB_TOKEN'

export interface RepoConfig {
  owner: string
  repo: string
  branch: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export function getRepoConfig(): RepoConfig {
  return {
    owner: requireEnv(OWNER_ENV),
    repo: requireEnv(REPO_ENV),
    branch: process.env[BRANCH_ENV] ?? 'main',
  }
}

let cached: Octokit | null = null

export function getOctokit(): Octokit {
  if (cached) return cached
  const auth = requireEnv(TOKEN_ENV)
  cached = new Octokit({ auth, userAgent: 'my-skills-hub' })
  return cached
}

export class SkillFileConflictError extends Error {
  constructor(message = 'skill file sha conflict') {
    super(message)
    this.name = 'SkillFileConflictError'
  }
}

interface RequestErrorLike {
  status?: number
  message?: string
}

export function isConflictError(err: unknown): boolean {
  const e = err as RequestErrorLike
  if (!e || typeof e !== 'object') return false
  if (e.status === 409) return true
  if (e.status === 422 && typeof e.message === 'string' && /sha/i.test(e.message)) {
    return true
  }
  return false
}
