import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const SKILL_FILENAME = 'SKILL.md'

/**
 * Directory that holds `<name>/SKILL.md` folders. Resolved lazily via
 * `process.cwd()` so tests can `chdir` before invoking readers.
 */
export function getSkillsDir(): string {
  return path.join(process.cwd(), 'skills')
}

/** @deprecated use `getSkillsDir()` — snapshot at module load broke test setup. */
export const SKILLS_DIR = getSkillsDir()

export function skillFilePath(name: string): string {
  return path.join(getSkillsDir(), name, SKILL_FILENAME)
}

export function skillRepoPath(name: string): string {
  return `skills/${name}/${SKILL_FILENAME}`
}

export function computeBlobSha(content: string | Buffer): string {
  const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
  const hash = createHash('sha1')
  hash.update(`blob ${buf.length}\0`)
  hash.update(buf)
  return hash.digest('hex')
}

export async function listSkillDirs(): Promise<string[]> {
  let entries: string[]
  try {
    const raw = await fs.readdir(getSkillsDir(), { withFileTypes: true })
    entries = raw.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  return entries.sort()
}

export interface RawSkillFile {
  raw: string
  sha: string
  sizeBytes: number
}

export async function readSkillFile(name: string): Promise<RawSkillFile | null> {
  const filePath = skillFilePath(name)
  let buf: Buffer
  try {
    buf = await fs.readFile(filePath)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
  return {
    raw: buf.toString('utf8'),
    sha: computeBlobSha(buf),
    sizeBytes: buf.length,
  }
}
