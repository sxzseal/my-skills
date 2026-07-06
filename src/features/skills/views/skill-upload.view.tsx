'use client'

import { useTranslations } from 'next-intl'
import { Loader2, Github } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Dropzone } from '../components/dropzone'
import { StepBadge } from '../components/step-badge'
import { ChangePreview } from '../components/change-preview'
import { UploadResultCard } from '../components/upload-result-card'
import type { SkillDetail } from '../queries'
import { useSkillUploadController } from '../hooks/use-skill-upload-controller'
import { SkillUploadFormFields } from './skill-upload/skill-upload-form'
import { SkillUploadSidebar } from './skill-upload/skill-upload-sidebar'

type Mode = 'create' | 'update'

interface SkillUploadViewProps {
  mode: Mode
  existing: SkillDetail | null
}

export function SkillUploadView({ mode, existing }: SkillUploadViewProps) {
  const t = useTranslations('MySkills.upload')
  const formT = useTranslations('MySkills.upload.form')
  const controller = useSkillUploadController({ mode, existing })

  const {
    form,
    isUpdate,
    updateCtx,
    tokenState,
    setTokenState,
    file,
    preview,
    setPreview,
    uploadState,
    commitSha,
    errorMessage,
    isSubmitting,
    canSubmit,
    translateZodKey,
    handleFileChange,
    onSubmit,
    resetForNewUpload,
    resetErrorState,
  } = controller

  const currentValues = form.watch()

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            {updateCtx && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                {t('updateBadge')}
              </Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight">
              {updateCtx ? t('updateTitle', { name: updateCtx.name }) : t('title')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {updateCtx ? t('updateSubtitle') : t('subtitle')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <div className="flex flex-col gap-6 min-w-0">
            <div>
              <StepBadge step={1} title={isUpdate ? t('step1Update') : t('step1')} />
              <Dropzone file={file} onFileChange={handleFileChange} />
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
              >
                <StepBadge step={2} title={t('step2')} />

                <SkillUploadFormFields
                  form={form}
                  isUpdate={isUpdate}
                  updateCtx={updateCtx}
                  translateZodKey={translateZodKey}
                />

                {updateCtx && (
                  <ChangePreview
                    fromVersion={updateCtx.version}
                    fromTags={updateCtx.tags}
                    toVersion={currentValues.version}
                    toTags={currentValues.tags}
                  />
                )}

                <StepBadge step={3} title={isUpdate ? t('step3Update') : t('step3')} />

                <UploadResultCard
                  state={uploadState}
                  commitSha={commitSha}
                  errorMessage={errorMessage}
                  onRetry={resetErrorState}
                  onUploadAnother={resetForNewUpload}
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    size="lg"
                    className="min-w-[160px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        {formT('submitting')}
                      </>
                    ) : (
                      <>
                        <Github className="mr-1.5 h-4 w-4" />
                        {isUpdate ? formT('submitUpdate') : formT('submit')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <SkillUploadSidebar
            tokenState={tokenState}
            setTokenState={setTokenState}
            preview={preview}
            setPreview={setPreview}
          />
        </div>
      </div>
    </div>
  )
}
