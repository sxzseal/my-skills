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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {initialSkills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
