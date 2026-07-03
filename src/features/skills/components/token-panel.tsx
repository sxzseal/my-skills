'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export type TokenState = 'missing' | 'validating' | 'valid' | 'invalid'

interface TokenPanelProps {
  state: TokenState
  onStateChange: (s: TokenState) => void
}

const VALIDATION_DELAY_MS = 700

function useValidationTimer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
  return (cb: () => void, delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(cb, delay)
  }
}

export function TokenPanel({ state, onStateChange }: TokenPanelProps) {
  const t = useTranslations('MySkills.upload.token')
  const [token, setToken] = useState('')
  const schedule = useValidationTimer()

  const handleValidate = () => {
    if (!token.trim()) return
    onStateChange('validating')
    schedule(() => {
      onStateChange(
        token.startsWith('ghp_') || token.startsWith('github_pat_')
          ? 'valid'
          : 'invalid',
      )
    }, VALIDATION_DELAY_MS)
  }

  if (state === 'valid') {
    return (
      <Alert className="border-primary/40 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">{t('tokenValid')}</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">ghp_••••••••••••••••</span>
          <Button variant="ghost" size="sm" onClick={() => onStateChange('missing')}>
            {t('changeToken')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">{t('title')}</div>
        </div>
        <p className="text-xs text-muted-foreground">{t('desc')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder={t('placeholder')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-xs"
            aria-label={t('title')}
          />
          <Button
            onClick={handleValidate}
            disabled={state === 'validating' || !token.trim()}
          >
            {state === 'validating' ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {t('validate')}
              </>
            ) : (
              t('validate')
            )}
          </Button>
        </div>
        {state === 'invalid' && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{t('tokenInvalid')}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{t('helper')}</span>
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {t('howTo')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
