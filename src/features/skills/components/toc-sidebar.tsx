'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { slugify } from '../lib/slug'

export interface HeadingItem {
  id: string
  text: string
  level: number
}

export function extractHeadings(md: string): HeadingItem[] {
  const lines = md.split('\n')
  const items: HeadingItem[] = []
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    items.push({ id: slugify(text), text, level })
  }
  return items
}

interface TocSidebarProps {
  headings: HeadingItem[]
}

export function TocSidebar({ headings }: TocSidebarProps) {
  const t = useTranslations('MySkills.detail')
  if (headings.length === 0) return null
  return (
    <div className="sticky top-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('toc')}
      </div>
      <ul className="space-y-1 text-sm">
        {headings.map((h, i) => (
          <li key={`${h.id}-${i}`}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block truncate rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                h.level === 2 && 'pl-4',
                h.level === 3 && 'pl-6 text-xs',
                i === 0 && 'bg-accent text-accent-foreground font-medium',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
