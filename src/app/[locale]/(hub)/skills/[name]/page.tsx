import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getSkillDetailServer } from '@/features/skills/server'
import { SkillDetailView } from '@/features/skills/views/skill-detail.view'
import type { Metadata } from 'next'

interface DetailPageProps {
  params: Promise<{ locale: string; name: string }>
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { locale, name } = await params
  const detail = await getSkillDetailServer(name).catch(() => null)
  const t = await getTranslations({ locale, namespace: 'MySkills' })
  if (!detail) {
    return { title: t('detail.notFoundTitle') }
  }
  return {
    title: `${detail.displayName} · ${t('brand')}`,
    description: detail.description,
  }
}

export default async function SkillDetailPage({ params }: DetailPageProps) {
  const { locale, name } = await params
  setRequestLocale(locale)
  const detail = await getSkillDetailServer(name)
  if (!detail) notFound()
  return <SkillDetailView skill={detail} />
}
