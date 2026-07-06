import { describe, expect, it } from 'vitest'
import {
  nameRegex,
  versionRegex,
  parseTagsInput,
  skillUpsertBodySchema,
} from '@/features/skills/schemas'

describe('nameRegex', () => {
  it.each(['foo', 'foo-bar', 'a1', 'x', 'a1-b2-c3'])('accepts %s', (name) => {
    expect(nameRegex.test(name)).toBe(true)
  })

  it.each(['Foo', '1foo', '-foo', 'foo_bar', 'foo bar', '', 'FOO', 'foo.bar'])(
    'rejects %s',
    (name) => {
      expect(nameRegex.test(name)).toBe(false)
    },
  )
})

describe('versionRegex', () => {
  it.each(['1.2.3', '1.2.3-rc.1', '1.2.3.4', '0.1.0', '10.20.30'])(
    'accepts %s',
    (v) => {
      expect(versionRegex.test(v)).toBe(true)
    },
  )

  it.each(['1.2', 'v1.2.3', '1.2.3 ', ' 1.2.3', '', '1.a.3'])(
    'rejects %s',
    (v) => {
      expect(versionRegex.test(v)).toBe(false)
    },
  )
})

describe('parseTagsInput', () => {
  it('dedupes, trims, drops empty', () => {
    expect(parseTagsInput(' a, b ,a, ,c ')).toEqual(['a', 'b', 'c'])
  })

  it('returns empty for empty string', () => {
    expect(parseTagsInput('')).toEqual([])
  })

  it('returns empty for whitespace-only', () => {
    expect(parseTagsInput('  ,  ,  ')).toEqual([])
  })

  it('preserves order of first occurrence', () => {
    expect(parseTagsInput('z, a, m, a, z')).toEqual(['z', 'a', 'm'])
  })
})

describe('skillUpsertBodySchema · content size boundary', () => {
  function baseBody(content: string) {
    return {
      name: 'foo',
      displayName: 'Foo',
      description: 'x',
      version: '0.1.0',
      tags: [],
      content,
    }
  }

  it('accepts content at exactly 262144 chars', () => {
    const content = 'a'.repeat(262_144)
    expect(skillUpsertBodySchema.safeParse(baseBody(content)).success).toBe(true)
  })

  it('rejects content over 262144 chars', () => {
    const content = 'a'.repeat(262_145)
    expect(skillUpsertBodySchema.safeParse(baseBody(content)).success).toBe(false)
  })

  it('rejects tags over 20 entries', () => {
    const body = { ...baseBody('x'), tags: Array.from({ length: 21 }, (_, i) => `t${i}`) }
    expect(skillUpsertBodySchema.safeParse(body).success).toBe(false)
  })
})
