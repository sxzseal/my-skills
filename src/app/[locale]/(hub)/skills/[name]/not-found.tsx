'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

export default function SkillNotFound() {
  const t = useTranslations('MySkills.detail')
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold">{t('notFoundTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('notFoundDesc')}</p>
        </div>
      </div>
    </div>
  )
}
