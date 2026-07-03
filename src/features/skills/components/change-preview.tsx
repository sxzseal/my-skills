'use client'

import { useTranslations } from 'next-intl'

interface ChangePreviewProps {
  fromVersion: string
  fromTags: string[]
  toVersion: string
  toTags: string
}

export function ChangePreview({ fromVersion, fromTags, toVersion, toTags }: ChangePreviewProps) {
  const t = useTranslations('MySkills.upload.form')
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">{t('diffTitle')}</div>
      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('diffFrom')}
          </div>
          <div className="mt-1 font-mono truncate">
            v{fromVersion} · {fromTags.join(', ')}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary">{t('diffTo')}</div>
          <div className="mt-1 font-mono text-primary truncate">
            v{toVersion} · {toTags}
          </div>
        </div>
      </div>
    </div>
  )
}
