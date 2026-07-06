import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { computeBlobSha } from '@/lib/skill-fs'

// The `listSkillDirs`/`readSkillFile` helpers read from `process.cwd()/skills`.
// Rather than mocking node:fs (fragile with Node ESM builtins), point cwd at a
// throwaway temp dir seeded with the fixtures we want to observe.
const originalCwd = process.cwd()
let tmpDir = ''

async function seedSkillsDir(entries: Record<string, string>) {
  await fs.mkdir(path.join(tmpDir, 'skills'), { recursive: true })
  for (const [name, content] of Object.entries(entries)) {
    const dir = path.join(tmpDir, 'skills', name)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'SKILL.md'), content, 'utf8')
  }
}

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'my-skills-fs-'))
  process.chdir(tmpDir)
})

afterAll(async () => {
  process.chdir(originalCwd)
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('computeBlobSha', () => {
  it('matches git blob SHA-1 for empty string', () => {
    expect(computeBlobSha('')).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
  })

  it("matches git blob SHA-1 for 'hello\\n'", () => {
    expect(computeBlobSha('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  })

  it('handles multi-byte UTF-8 input deterministically', () => {
    const sha = computeBlobSha('中文\n')
    expect(sha).toMatch(/^[0-9a-f]{40}$/)
    expect(computeBlobSha('中文\n')).toBe(sha)
  })

  it('produces the same sha from string and Buffer input', () => {
    expect(computeBlobSha('hello\n')).toBe(
      computeBlobSha(Buffer.from('hello\n', 'utf8')),
    )
  })
})

describe('listSkillDirs', () => {
  it('returns sorted directory names, skipping loose files', async () => {
    // Re-import inside test so module cwd resolves fresh; skills-fs uses
    // path.join(process.cwd(), 'skills') at call time, so this actually
    // works with the imported module too.
    await seedSkillsDir({ zed: '# zed', alpha: '# alpha' })
    await fs.writeFile(path.join(tmpDir, 'skills', 'stray.md'), 'ignored')
    const { listSkillDirs } = await import('@/lib/skill-fs')
    const out = await listSkillDirs()
    expect(out.sort()).toEqual(['alpha', 'zed'])
    // Clean up between tests
    await fs.rm(path.join(tmpDir, 'skills'), { recursive: true, force: true })
  })

  it('returns [] when the skills directory does not exist', async () => {
    await fs.rm(path.join(tmpDir, 'skills'), { recursive: true, force: true })
    const { listSkillDirs } = await import('@/lib/skill-fs')
    await expect(listSkillDirs()).resolves.toEqual([])
  })
})

describe('readSkillFile', () => {
  it('returns raw + sha + sizeBytes on success', async () => {
    await seedSkillsDir({ hello: 'hello\n' })
    const { readSkillFile } = await import('@/lib/skill-fs')
    const result = await readSkillFile('hello')
    expect(result).not.toBeNull()
    expect(result!.raw).toBe('hello\n')
    expect(result!.sha).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
    expect(result!.sizeBytes).toBe(6)
    await fs.rm(path.join(tmpDir, 'skills'), { recursive: true, force: true })
  })

  it('returns null when the file does not exist', async () => {
    const { readSkillFile } = await import('@/lib/skill-fs')
    await expect(readSkillFile('missing')).resolves.toBeNull()
  })
})
