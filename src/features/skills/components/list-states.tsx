'use client'

import { useTranslations } from 'next-intl'
import { Package, UploadCloud, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function ListLoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[180px] animate-pulse rounded-xl border border-border bg-card/40"
        />
      ))}
    </div>
  )
}

export function ListEmptyState() {
  const t = useTranslations('MySkills.list')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Package className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground">{t('empty')}</p>
      <Button asChild>
        <Link href="/upload">
          <UploadCloud className="mr-1.5 h-4 w-4" />
          {t('emptyCta')}
        </Link>
      </Button>
    </div>
  )
}

interface ListErrorStateProps {
  detail?: string
  onRetry?: () => void
}

export function ListErrorState({ detail, onRetry }: ListErrorStateProps) {
  const t = useTranslations('MySkills.list')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-destructive">{t('errorTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail ?? t('errorDetail')}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          {t('errorRetry')}
        </Button>
      )}
    </div>
  )
}
