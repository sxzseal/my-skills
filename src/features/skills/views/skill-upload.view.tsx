'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, Github } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { useRouter } from '@/i18n/navigation'
import {
  skillFormSchema,
  parseTagsInput,
  type SkillFormValues,
} from '../schemas'
import { upsertSkillRequest } from '../mutations'
import type { SkillDetail } from '../queries'
import { Dropzone } from '../components/dropzone'
import { TokenPanel, type TokenState } from '../components/token-panel'
import { StepBadge } from '../components/step-badge'
import { ChangePreview } from '../components/change-preview'
import { UploadResultCard, type UploadState } from '../components/upload-result-card'
import { RequestError } from '@/lib/request'

type Mode = 'create' | 'update'

interface SkillUploadViewProps {
  mode: Mode
  existing: SkillDetail | null
}

const DEFAULT_FORM: SkillFormValues = {
  name: '',
  displayName: '',
  description: '',
  version: '0.1.0',
  tags: '',
}

function bumpPatchVersion(v: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v)
  if (!m) return v
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`
}

function useFileReader() {
  const readerRef = useRef<FileReader | null>(null)
  useEffect(() => {
    return () => {
      readerRef.current?.abort()
    }
  }, [])
  return (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      readerRef.current?.abort()
      const reader = new FileReader()
      readerRef.current = reader
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('read failed'))
      reader.readAsText(file)
    })
  }
}

function useZodErrorTranslator() {
  const t = useTranslations('Errors.skillForm')
  return (key: string): string => {
    switch (key) {
      case 'name.required':
        return t('nameRequired')
      case 'name.pattern':
        return t('namePattern')
      case 'displayName.required':
        return t('displayNameRequired')
      case 'description.required':
        return t('descriptionRequired')
      case 'description.max':
        return t('descriptionMax')
      case 'version.pattern':
        return t('versionPattern')
      default:
        return key
    }
  }
}

export function SkillUploadView({ mode, existing }: SkillUploadViewProps) {
  const t = useTranslations('MySkills.upload')
  const formT = useTranslations('MySkills.upload.form')
  const resultT = useTranslations('MySkills.upload.result')
  const translateZodKey = useZodErrorTranslator()
  const readFileAsText = useFileReader()
  const router = useRouter()

  const isUpdate = mode === 'update' && existing !== null

  const [tokenState, setTokenState] = useState<TokenState>('missing')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(isUpdate ? existing!.content : '')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [commitSha, setCommitSha] = useState<string | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const initialValues = useMemo<SkillFormValues>(() => {
    if (isUpdate) {
      return {
        name: existing!.name,
        displayName: existing!.displayName,
        description: existing!.description,
        version: bumpPatchVersion(existing!.version),
        tags: existing!.tags.join(', '),
      }
    }
    return { ...DEFAULT_FORM }
  }, [isUpdate, existing])

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  })

  const currentValues = form.watch()

  const canSubmit =
    tokenState === 'valid' &&
    (isUpdate || (file !== null && preview.trim().length > 0)) &&
    !form.formState.isSubmitting

  const isSubmitting = uploadState === 'submitting' || form.formState.isSubmitting

  const handleFileChange = async (f: File | null) => {
    setFile(f)
    if (!f) {
      if (!isUpdate) setPreview('')
      return
    }
    if (f.name.endsWith('.md')) {
      try {
        const text = await readFileAsText(f)
        setPreview(text)
      } catch {
        toast.error(formT('previewEmpty'))
      }
    } else {
      setPreview('')
    }
  }

  const onSubmit = async (values: SkillFormValues) => {
    setUploadState('submitting')
    setErrorMessage(undefined)
    try {
      const contentToSubmit =
        preview.trim().length > 0 ? preview : isUpdate ? existing!.content : ''
      const result = await upsertSkillRequest({
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        version: values.version,
        tags: parseTagsInput(values.tags),
        content: contentToSubmit,
        sha: isUpdate ? existing!.sha : undefined,
      })
      setCommitSha(result.commitSha)
      setUploadState('success')
      router.refresh()
    } catch (error: unknown) {
      setUploadState('error')
      if (error instanceof RequestError && error.statusCode === 409) {
        setErrorMessage(resultT('errorConflict'))
      } else if (error instanceof Error) {
        setErrorMessage(resultT('errorGeneric', { message: error.message }))
      } else {
        setErrorMessage(resultT('errorConflict'))
      }
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            {isUpdate && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                {t('updateBadge')}
              </Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight">
              {isUpdate ? t('updateTitle', { name: existing!.name }) : t('title')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isUpdate ? t('updateSubtitle') : t('subtitle')}
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          {formT('name')}
                          <span className="text-destructive"> {formT('required')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={formT('namePlaceholder')}
                            {...field}
                            disabled={isUpdate}
                            readOnly={isUpdate}
                            className={cn(isUpdate && 'cursor-not-allowed opacity-70')}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          {isUpdate ? formT('nameLocked') : formT('nameHint')}
                        </FormDescription>
                        {fieldState.error?.message && (
                          <FormMessage>{translateZodKey(fieldState.error.message)}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          {formT('displayName')}
                          <span className="text-destructive"> {formT('required')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={formT('displayNamePlaceholder')} {...field} />
                        </FormControl>
                        {fieldState.error?.message && (
                          <FormMessage>{translateZodKey(fieldState.error.message)}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        {formT('description')}
                        <span className="text-destructive"> {formT('required')}</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder={formT('descriptionPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      {fieldState.error?.message && (
                        <FormMessage>{translateZodKey(fieldState.error.message)}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field, fieldState }) => {
                      const suggested = isUpdate ? bumpPatchVersion(existing!.version) : null
                      return (
                        <FormItem>
                          <FormLabel>
                            {formT('version')}
                            <span className="text-destructive"> {formT('required')}</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={formT('versionPlaceholder')} {...field} />
                          </FormControl>
                          {suggested && (
                            <FormDescription className="text-[11px]">
                              {formT('versionSuggest', { suggested })}{' '}
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() =>
                                  form.setValue('version', suggested, { shouldValidate: true })
                                }
                              >
                                ↩
                              </button>
                            </FormDescription>
                          )}
                          {fieldState.error?.message && (
                            <FormMessage>{translateZodKey(fieldState.error.message)}</FormMessage>
                          )}
                        </FormItem>
                      )
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{formT('tags')}</FormLabel>
                        <FormControl>
                          <Input placeholder={formT('tagsPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isUpdate && (
                  <ChangePreview
                    fromVersion={existing!.version}
                    fromTags={existing!.tags}
                    toVersion={currentValues.version}
                    toTags={currentValues.tags}
                  />
                )}

                <StepBadge step={3} title={isUpdate ? t('step3Update') : t('step3')} />

                <UploadResultCard
                  state={uploadState}
                  commitSha={commitSha}
                  errorMessage={errorMessage}
                  onRetry={() => setUploadState('idle')}
                  onUploadAnother={() => {
                    setUploadState('idle')
                    setCommitSha(undefined)
                    if (!isUpdate) {
                      form.reset(DEFAULT_FORM)
                      setFile(null)
                      setPreview('')
                    }
                  }}
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
        </div>
      </div>
    </div>
  )
}
