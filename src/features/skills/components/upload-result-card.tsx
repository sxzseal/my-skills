'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, AlertCircle, ArrowLeft, Github } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export type UploadState = 'idle' | 'submitting' | 'success' | 'error'

interface UploadResultCardProps {
  state: UploadState
  commitSha?: string
  errorMessage?: string
  onRetry?: () => void
  onUploadAnother?: () => void
}

export function UploadResultCard({
  state,
  commitSha,
  errorMessage,
  onRetry,
  onUploadAnother,
}: UploadResultCardProps) {
  const t = useTranslations('MySkills.upload.result')
  const buildStatusT = useTranslations('MySkills.upload.result.buildStatus')

  if (state === 'success') {
    return (
      <Alert className="border-primary/40 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">{t('successTitle')}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-2">
          <div className="text-xs">{t('successBuildingLine')}</div>
          {commitSha && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Github className="h-3 w-3" />
              <code>Commit: {commitSha.slice(0, 8)}</code>
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {buildStatusT('building')}
              </Badge>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-3 w-3" />
                {t('viewList')}
              </Link>
            </Button>
            {onUploadAnother && (
              <Button size="sm" onClick={onUploadAnother}>
                {t('uploadAnother')}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (state === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('errorTitle')}</AlertTitle>
        <AlertDescription>
          <div className="text-xs">{errorMessage ?? t('errorConflict')}</div>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
              {t('errorRetry')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
