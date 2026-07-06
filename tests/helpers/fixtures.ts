import type { SkillSummary, SkillDetail } from '@/features/skills/queries'

export function createSkillSummary(overrides?: Partial<SkillSummary>): SkillSummary {
  return {
    name: 'sample-skill',
    displayName: 'Sample Skill',
    description: 'A skill fixture used in tests',
    version: '0.1.0',
    tags: ['test'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    sha: 'a'.repeat(40),
    sizeBytes: 512,
    ...overrides,
  }
}

export function createSkillDetail(overrides?: Partial<SkillDetail>): SkillDetail {
  const base = createSkillSummary()
  return {
    ...base,
    content: '# Sample\n\nHello world.\n',
    frontmatterRaw: 'name: sample-skill\ndisplayName: Sample Skill\nversion: 0.1.0',
    ...overrides,
  }
}

export function createRawSkillMarkdown(overrides?: {
  name?: string
  displayName?: string
  description?: string
  version?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  body?: string
}): string {
  const name = overrides?.name ?? 'sample-skill'
  const displayName = overrides?.displayName ?? 'Sample Skill'
  const description = overrides?.description ?? 'A skill fixture used in tests'
  const version = overrides?.version ?? '0.1.0'
  const tags = overrides?.tags ?? ['test']
  const createdAt = overrides?.createdAt ?? '2026-01-01T00:00:00.000Z'
  const updatedAt = overrides?.updatedAt ?? '2026-01-02T00:00:00.000Z'
  const body = overrides?.body ?? '# Sample\n\nHello world.\n'
  const tagLine = `[${tags.map((t) => JSON.stringify(t)).join(', ')}]`
  return `---
name: ${name}
displayName: ${displayName}
description: ${description}
version: ${version}
tags: ${tagLine}
createdAt: ${createdAt}
updatedAt: ${updatedAt}
---

${body}`
}
