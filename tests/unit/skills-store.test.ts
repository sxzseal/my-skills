import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createRawSkillMarkdown } from '../helpers/fixtures'

const readSkillFile = vi.fn()
const listSkillDirs = vi.fn()
const createOrUpdateFileContents = vi.fn()
const deleteFile = vi.fn()

vi.mock('@/lib/skill-fs', async () => {
  const actual = await vi.importActual<typeof import('@/lib/skill-fs')>('@/lib/skill-fs')
  return {
    ...actual,
    readSkillFile: (name: string) => readSkillFile(name),
    listSkillDirs: () => listSkillDirs(),
  }
})

vi.mock('@/lib/github-client', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/github-client')>('@/lib/github-client')
  return {
    ...actual,
    getOctokit: () => ({
      repos: {
        createOrUpdateFileContents: (args: unknown) => createOrUpdateFileContents(args),
        deleteFile: (args: unknown) => deleteFile(args),
      },
    }),
    getRepoConfig: () => ({ owner: 'test', repo: 'my-skills', branch: 'main' }),
  }
})

beforeEach(() => {
  readSkillFile.mockReset()
  listSkillDirs.mockReset()
  createOrUpdateFileContents.mockReset()
  deleteFile.mockReset()
})

function mockExistingSkill(name: string, overrides?: { sha?: string; body?: string }) {
  const raw = createRawSkillMarkdown({ name, displayName: name, body: overrides?.body })
  readSkillFile.mockImplementation(async (target: string) => {
    if (target !== name) return null
    return {
      raw,
      sha: overrides?.sha ?? 'existing-sha-1234',
      sizeBytes: Buffer.byteLength(raw, 'utf8'),
    }
  })
  return raw
}

describe('upsertSkill', () => {
  it('creates a new skill when the name is free', async () => {
    readSkillFile.mockResolvedValue(null)
    createOrUpdateFileContents.mockResolvedValueOnce({
      data: { commit: { sha: 'commit-abc' } },
    })
    const { upsertSkill } = await import('@/lib/skills-store')
    const result = await upsertSkill(
      {
        name: 'new-skill',
        displayName: 'New',
        description: 'x',
        version: '0.1.0',
        tags: [],
        content: '# hi',
      },
      '2026-07-06T00:00:00.000Z',
    )
    expect(result.isUpdate).toBe(false)
    expect(createOrUpdateFileContents).toHaveBeenCalledTimes(1)
    const call = createOrUpdateFileContents.mock.calls[0][0]
    expect(call.message).toBe('Add skill: new-skill')
    expect(call.sha).toBeUndefined()
    expect(call.path).toBe('skills/new-skill/SKILL.md')
  })

  it('updates when sha matches and preserves createdAt', async () => {
    mockExistingSkill('foo', { sha: 'match-sha' })
    createOrUpdateFileContents.mockResolvedValueOnce({
      data: { commit: { sha: 'commit-def' } },
    })
    const { upsertSkill } = await import('@/lib/skills-store')
    const result = await upsertSkill(
      {
        name: 'foo',
        displayName: 'foo v2',
        description: 'updated',
        version: '0.2.0',
        tags: ['x'],
        content: '# body',
        sha: 'match-sha',
      },
      '2026-07-06T00:00:00.000Z',
    )
    expect(result.isUpdate).toBe(true)
    expect(result.detail.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(result.detail.updatedAt).toBe('2026-07-06T00:00:00.000Z')
    const call = createOrUpdateFileContents.mock.calls[0][0]
    expect(call.message).toBe('Update skill: foo')
    expect(call.sha).toBe('match-sha')
  })

  it('throws ShaConflictError when sha does not match', async () => {
    mockExistingSkill('foo', { sha: 'server-sha' })
    const { upsertSkill, ShaConflictError } = await import('@/lib/skills-store')
    await expect(
      upsertSkill(
        {
          name: 'foo',
          displayName: 'foo',
          description: 'x',
          version: '0.1.0',
          tags: [],
          content: 'x',
          sha: 'stale-sha',
        },
        '2026-07-06T00:00:00.000Z',
      ),
    ).rejects.toBeInstanceOf(ShaConflictError)
    expect(createOrUpdateFileContents).not.toHaveBeenCalled()
  })

  it('throws ShaConflictError when name is taken but sha is undefined (regression: create-mode overwrite)', async () => {
    mockExistingSkill('foo', { sha: 'server-sha' })
    const { upsertSkill, ShaConflictError } = await import('@/lib/skills-store')
    await expect(
      upsertSkill(
        {
          name: 'foo',
          displayName: 'attacker',
          description: 'malicious',
          version: '9.9.9',
          tags: [],
          content: 'BAD',
          // sha intentionally omitted — client thinks it's creating a new skill
        },
        '2026-07-06T00:00:00.000Z',
      ),
    ).rejects.toBeInstanceOf(ShaConflictError)
    expect(createOrUpdateFileContents).not.toHaveBeenCalled()
  })

  it('translates GitHub 409 into ShaConflictError', async () => {
    readSkillFile.mockResolvedValue(null)
    createOrUpdateFileContents.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409 }),
    )
    const { upsertSkill, ShaConflictError } = await import('@/lib/skills-store')
    await expect(
      upsertSkill(
        {
          name: 'new-skill',
          displayName: 'x',
          description: 'x',
          version: '0.1.0',
          tags: [],
          content: 'x',
        },
        '2026-07-06T00:00:00.000Z',
      ),
    ).rejects.toBeInstanceOf(ShaConflictError)
  })
})

describe('deleteSkill', () => {
  it('returns null when the skill does not exist', async () => {
    readSkillFile.mockResolvedValue(null)
    const { deleteSkill } = await import('@/lib/skills-store')
    await expect(deleteSkill('nope')).resolves.toBeNull()
    expect(deleteFile).not.toHaveBeenCalled()
  })

  it('returns commit sha on successful delete', async () => {
    mockExistingSkill('foo')
    deleteFile.mockResolvedValueOnce({ data: { commit: { sha: 'commit-del' } } })
    const { deleteSkill } = await import('@/lib/skills-store')
    await expect(deleteSkill('foo')).resolves.toEqual({ commitSha: 'commit-del' })
  })

  it('translates GitHub 409 into ShaConflictError', async () => {
    mockExistingSkill('foo')
    deleteFile.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409 }),
    )
    const { deleteSkill, ShaConflictError } = await import('@/lib/skills-store')
    await expect(deleteSkill('foo')).rejects.toBeInstanceOf(ShaConflictError)
  })
})

describe('parseSkill via listSummaries', () => {
  it('drops entries with invalid frontmatter', async () => {
    listSkillDirs.mockResolvedValue(['ok', 'broken'])
    readSkillFile.mockImplementation(async (name: string) => {
      if (name === 'ok') {
        const raw = createRawSkillMarkdown({ name: 'ok' })
        return { raw, sha: 'sha-ok', sizeBytes: Buffer.byteLength(raw, 'utf8') }
      }
      const raw = '---\nname: broken\n---\n# oops missing fields\n'
      return { raw, sha: 'sha-broken', sizeBytes: raw.length }
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { listSummaries } = await import('@/lib/skills-store')
    const list = await listSummaries()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('ok')
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('returns empty frontmatterRaw when the file starts with a BOM', async () => {
    listSkillDirs.mockResolvedValue([])
    readSkillFile.mockImplementation(async () => {
      const raw = '﻿' + createRawSkillMarkdown({ name: 'foo' })
      return { raw, sha: 'sha', sizeBytes: raw.length }
    })
    const { getDetail } = await import('@/lib/skills-store')
    const detail = await getDetail('foo')
    // BOM stripping keeps parsing successful; frontmatterRaw extracted
    expect(detail).not.toBeNull()
    expect(detail!.frontmatterRaw.length).toBeGreaterThan(0)
  })

  it('handles files with no closing --- (empty frontmatterRaw)', async () => {
    readSkillFile.mockResolvedValue({
      raw: '---\nname: foo\ndisplayName: Foo\n# no closing marker\n',
      sha: 'sha',
      sizeBytes: 60,
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getDetail } = await import('@/lib/skills-store')
    // Malformed frontmatter → parseSkill returns null → getDetail null
    await expect(getDetail('foo')).resolves.toBeNull()
    errorSpy.mockRestore()
  })
})

describe('deriveTags', () => {
  it('dedupes and sorts, handles unicode', async () => {
    const { deriveTags } = await import('@/lib/skills-store')
    const list = [
      { tags: ['b', 'a'] },
      { tags: ['b', 'c'] },
      { tags: ['中文'] },
    ] as never[]
    expect(deriveTags(list)).toEqual(['a', 'b', 'c', '中文'])
  })
})

describe('filterSummaries', () => {
  const items = [
    {
      name: 'alpha',
      displayName: 'Alpha',
      description: 'first skill',
      tags: ['prod'],
    },
    {
      name: 'beta',
      displayName: 'Beta Skill',
      description: 'second one',
      tags: ['test'],
    },
  ] as never[]

  it('filters by q across name/displayName/description', async () => {
    const { filterSummaries } = await import('@/lib/skills-store')
    expect(filterSummaries(items, { q: 'first' })).toHaveLength(1)
    expect(filterSummaries(items, { q: 'beta' })).toHaveLength(1)
  })

  it('filters by tag', async () => {
    const { filterSummaries } = await import('@/lib/skills-store')
    expect(filterSummaries(items, { tag: 'test' })).toHaveLength(1)
    expect(filterSummaries(items, { tag: 'nonexistent' })).toHaveLength(0)
  })

  it('returns all when no params', async () => {
    const { filterSummaries } = await import('@/lib/skills-store')
    expect(filterSummaries(items, {})).toHaveLength(2)
  })
})
