'use client'

import { useTranslations } from 'next-intl'
import { SkillCard } from '../components/skill-card'
import { SkillFilters } from '../components/skill-filters'
import { ListEmptyState } from '../components/list-states'
import type { SkillSummary } from '../queries'

interface SkillListViewProps {
  initialSkills: SkillSummary[]
  allTags: string[]
  initialQuery: string
  initialTag: string
}

export function SkillListView({
  initialSkills,
  allTags,
  initialQuery,
  initialTag,
}: SkillListViewProps) {
  const t = useTranslations('MySkills.list')

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <SkillFilters
            tags={allTags}
            resultCount={initialSkills.length}
            initialQuery={initialQuery}
            initialTag={initialTag}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          {initialSkills.length === 0 ? (
            <ListEmptyState />
          ) : (
            <SkillGrid skills={initialSkills} />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Grid renderer.
 *
 * For lists ≤ 100 items we render the plain CSS grid. Above that threshold we
 * layer on `content-visibility: auto` which lets the browser skip layout+paint
 * for off-viewport cards — cheap virtualization without a JS windowing lib.
 */
function SkillGrid({ skills }: { skills: SkillSummary[] }) {
  const isLarge = skills.length > 100
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {skills.map((skill) => (
        <div
          key={skill.name}
          style={
            isLarge
              ? { contentVisibility: 'auto', containIntrinsicSize: '180px' }
              : undefined
          }
        >
          <SkillCard skill={skill} />
        </div>
      ))}
    </div>
  )
}
