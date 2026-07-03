import { setRequestLocale } from 'next-intl/server'
import { getSkillDetailServer } from '@/features/skills/server'
import { SkillUploadView } from '@/features/skills/views/skill-upload.view'

interface UploadPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mode?: string; name?: string }>
}

export default async function UploadPage({ params, searchParams }: UploadPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const search = await searchParams

  const isUpdate = search.mode === 'update'
  const targetName = typeof search.name === 'string' ? search.name : undefined
  const existing =
    isUpdate && targetName ? await getSkillDetailServer(targetName).catch(() => null) : null

  return <SkillUploadView mode={isUpdate && existing ? 'update' : 'create'} existing={existing} />
}
