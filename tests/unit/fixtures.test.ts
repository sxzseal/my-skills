import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { SKILL_LIST, SKILL_DETAILS } from '../../mocks/fixtures/skills'

const skillSummarySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  tags: z.array(z.string()),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  sha: z.string().min(1),
  sizeBytes: z.number().int().min(0),
})

const skillDetailSchema = skillSummarySchema.extend({
  content: z.string().min(1),
  frontmatterRaw: z.string().min(1),
})

describe('mocks/fixtures/skills · shape drift', () => {
  it('every SKILL_LIST entry matches SkillSummary shape', () => {
    for (const item of SKILL_LIST) {
      const parsed = skillSummarySchema.safeParse(item)
      if (!parsed.success) {
        throw new Error(
          `${item.name} fails: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        )
      }
    }
  })

  it('every SKILL_DETAILS entry matches SkillDetail shape', () => {
    for (const [name, detail] of Object.entries(SKILL_DETAILS)) {
      const parsed = skillDetailSchema.safeParse(detail)
      if (!parsed.success) {
        throw new Error(
          `${name} fails: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        )
      }
    }
  })

  it('SKILL_DETAILS keys are a subset of SKILL_LIST names', () => {
    const listNames = new Set(SKILL_LIST.map((s) => s.name))
    for (const key of Object.keys(SKILL_DETAILS)) {
      expect(listNames.has(key)).toBe(true)
    }
  })
})
