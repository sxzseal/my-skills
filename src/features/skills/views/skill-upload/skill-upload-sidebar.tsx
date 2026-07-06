'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TokenPanel, type TokenState } from '../../components/token-panel'

interface SkillUploadSidebarProps {
  tokenState: TokenState
  setTokenState: (s: TokenState) => void
  preview: string
  setPreview: (v: string) => void
}

export function SkillUploadSidebar({
  tokenState,
  setTokenState,
  preview,
  setPreview,
}: SkillUploadSidebarProps) {
  const formT = useTranslations('MySkills.upload.form')

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <TokenPanel state={tokenState} onStateChange={setTokenState} />

      <Card>
        <CardHeader className="pb-3">
          <div className="text-sm font-semibold">{formT('preview')}</div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[300px] overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
            <code>{preview || formT('previewEmpty')}</code>
          </pre>
          {!preview && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {formT('previewHint')}
            </div>
          )}
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setPreview('')}
            >
              {formT('previewClear')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
