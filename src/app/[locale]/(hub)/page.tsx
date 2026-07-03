import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { getSkillListServer } from '@/features/skills/server'
import { SkillListView } from '@/features/skills/views/skill-list.view'
import { ListLoadingGrid, ListErrorState } from '@/features/skills/components/list-states'

interface HomePageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; tag?: string }>
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const search = await searchParams
  const q = search.q?.trim() ?? ''
  const tag = search.tag?.trim() ?? ''

  return (
    <Suspense fallback={<ListLoadingGrid />}>
      <ListContent q={q} tag={tag} />
    </Suspense>
  )
}

async function ListContent({ q, tag }: { q: string; tag: string }) {
  try {
    const { list, tags } = await getSkillListServer({ q, tag })
    return (
      <SkillListView
        initialSkills={list}
        allTags={tags}
        initialQuery={q}
        initialTag={tag}
      />
    )
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : undefined
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <ListErrorState detail={detail} />
      </div>
    )
  }
}
