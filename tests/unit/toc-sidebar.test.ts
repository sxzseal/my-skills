import { describe, expect, it } from 'vitest'
import { extractHeadings } from '@/features/skills/components/toc-sidebar'

describe('extractHeadings', () => {
  it('captures h1/h2/h3 with correct level and slug', () => {
    const md = ['# Alpha', '## Beta', '### Gamma'].join('\n')
    expect(extractHeadings(md)).toEqual([
      { id: 'alpha', text: 'Alpha', level: 1 },
      { id: 'beta', text: 'Beta', level: 2 },
      { id: 'gamma', text: 'Gamma', level: 3 },
    ])
  })

  it('ignores headings inside fenced code blocks', () => {
    const md = ['# Real', '```', '# fake', '```', '## Also real'].join('\n')
    const items = extractHeadings(md)
    expect(items.map((i) => i.text)).toEqual(['Real', 'Also real'])
  })

  it('does not capture h4 or deeper', () => {
    const md = ['#### four', '##### five'].join('\n')
    expect(extractHeadings(md)).toEqual([])
  })

  it('unicode-aware slug preserves CJK', () => {
    const md = '# 中文标题'
    expect(extractHeadings(md)).toEqual([
      { id: '中文标题', text: '中文标题', level: 1 },
    ])
  })

  it('collapses multiple non-alphanum runs and trims leading/trailing hyphens', () => {
    const md = '# ---Hello, World!!!---'
    expect(extractHeadings(md)).toEqual([
      { id: 'hello-world', text: '---Hello, World!!!---', level: 1 },
    ])
  })
})
