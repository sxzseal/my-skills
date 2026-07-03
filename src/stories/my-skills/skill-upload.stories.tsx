import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Github,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

import { AppShell } from './_shared/AppShell'
import './_shared/theme.css'
import { DEFAULT_UPLOAD_FORM, SAMPLE_MARKDOWN_PREVIEW } from './my-skills.fixtures'
import { SKILL_DETAILS } from '../../../mocks/fixtures/skills'

type Mode = 'create' | 'update'

function bumpPatchVersion(v: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v)
  if (!m) return v
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`
}

const skillSchema = z.object({
  name: z
    .string()
    .min(1, 'name 不能为空')
    .regex(/^[a-z][a-z0-9-]*$/, '仅允许小写字母、数字、连字符，且以字母开头'),
  displayName: z.string().min(1, 'displayName 不能为空'),
  description: z.string().min(1, 'description 不能为空').max(200, '最多 200 字'),
  version: z.string().regex(/^\d+\.\d+\.\d+([.-][\w.-]+)?$/, '需符合 x.y.z 格式'),
  tags: z.string(),
})
type SkillFormValues = z.infer<typeof skillSchema>

type TokenState = 'missing' | 'validating' | 'valid' | 'invalid'
type UploadState = 'idle' | 'submitting' | 'building' | 'success' | 'error'

function TokenPanel({
  state,
  onStateChange,
}: {
  state: TokenState
  onStateChange: (s: TokenState) => void
}) {
  const t = useTranslations('MySkills.upload.token')
  const [token, setToken] = useState('')

  const handleValidate = () => {
    if (!token.trim()) return
    onStateChange('validating')
    setTimeout(() => {
      onStateChange(token.startsWith('ghp_') || token.startsWith('github_pat_') ? 'valid' : 'invalid')
    }, 700)
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

function Dropzone({
  file,
  onFileChange,
  markdownPreview,
}: {
  file: File | null
  onFileChange: (f: File | null) => void
  markdownPreview: string
}) {
  const t = useTranslations('MySkills.upload.dropzone')
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (!f) return
      if (!f.name.endsWith('.md') && !f.name.endsWith('.zip')) {
        // eslint-disable-next-line no-console
        console.warn('invalid type')
        return
      }
      onFileChange(f)
    },
    [onFileChange],
  )

  if (file) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · {t('fileNameLabel')}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onFileChange(null)}>
            <X className="mr-1 h-4 w-4" />
            {t('removeFile')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <label
      htmlFor="skill-file"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
          isDragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <UploadCloud className="h-7 w-7" />
      </div>
      <div className="mt-1 text-base font-medium">
        {isDragging ? t('activeLine') : t('idleLine1')}
      </div>
      <div className="text-sm text-muted-foreground">{t('idleLine2')}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">{t('supportedFormat')}</div>
      <input
        id="skill-file"
        type="file"
        accept=".md,.zip"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
        }}
      />
    </label>
  )
}

function SubmittingCard({ state }: { state: UploadState }) {
  const t = useTranslations('MySkills.upload.result')
  const buildStatusT = useTranslations('MySkills.upload.result.buildStatus')
  if (state === 'success') {
    return (
      <Alert className="border-primary/40 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">{t('successTitle')}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-2">
          <div className="text-xs">{t('successBuildingLine')}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Github className="h-3 w-3" />
            <code>Commit: a4c3d81f</code>
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {buildStatusT('building')}
            </Badge>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              {t('viewList')}
            </Button>
            <Button size="sm">{t('uploadAnother')}</Button>
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
          <div className="text-xs">GitHub API 返回 409: SHA conflict — 请刷新页面重试</div>
          <Button variant="outline" size="sm" className="mt-2">
            {t('errorRetry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

function SkillUploadPage({
  mode = 'create' as Mode,
  updateTargetName = 'copywriting',
  initialTokenState = 'valid' as TokenState,
  initialUploadState = 'idle' as UploadState,
  showFile = false,
}: {
  mode?: Mode
  updateTargetName?: string
  initialTokenState?: TokenState
  initialUploadState?: UploadState
  showFile?: boolean
}) {
  const t = useTranslations('MySkills.upload')
  const formT = useTranslations('MySkills.upload.form')
  const [tokenState, setTokenState] = useState<TokenState>(initialTokenState)
  const isUpdate = mode === 'update'
  const existing = isUpdate ? SKILL_DETAILS[updateTargetName] : null

  const [file, setFile] = useState<File | null>(
    showFile ? new File([SAMPLE_MARKDOWN_PREVIEW], 'daily-report.md') : null,
  )
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState)
  const [preview, setPreview] = useState<string>(
    isUpdate && existing
      ? existing.content
      : showFile
        ? SAMPLE_MARKDOWN_PREVIEW
        : '',
  )

  const initialFormValues = useMemo(() => {
    if (isUpdate && existing) {
      return {
        name: existing.name,
        displayName: existing.displayName,
        description: existing.description,
        version: bumpPatchVersion(existing.version),
        tags: existing.tags.join(', '),
      }
    }
    if (showFile) {
      return {
        name: 'daily-report',
        displayName: '日报生成器',
        description: '结构化生成日报 / 周报，可从 git commit、Notion、日历多源汇总',
        version: '1.1.0',
        tags: 'productivity, reporting',
      }
    }
    return { ...DEFAULT_UPLOAD_FORM }
  }, [isUpdate, existing, showFile])

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: initialFormValues,
  })

  const currentValues = form.watch()

  const canSubmit = tokenState === 'valid' && (!!file || isUpdate) && form.formState.isValid
  const isSubmitting = uploadState === 'submitting' || form.formState.isSubmitting

  const onSubmit = (values: SkillFormValues) => {
    setUploadState('submitting')
    // eslint-disable-next-line no-console
    console.log('submit', { mode, values, file: file?.name, sha: existing?.sha })
    setTimeout(() => setUploadState('success'), 800)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="flex items-center gap-3">
            {isUpdate && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                {t('updateBadge')}
              </Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight">
              {isUpdate
                ? t('updateTitle', { name: updateTargetName })
                : t('title')}
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
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </span>
                <h2 className="text-sm font-semibold">
                  {isUpdate ? t('step1Update') : t('step1')}
                </h2>
              </div>
              <Dropzone file={file} onFileChange={setFile} markdownPreview={preview} />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    2
                  </span>
                  <h2 className="text-sm font-semibold">{t('step2')}</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {formT('displayName')}
                          <span className="text-destructive"> {formT('required')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={formT('displayNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => {
                      const suggested = isUpdate && existing ? bumpPatchVersion(existing.version) : null
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
                                onClick={() => form.setValue('version', suggested)}
                              >
                                ↩
                              </button>
                            </FormDescription>
                          )}
                          <FormMessage />
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

                {isUpdate && existing && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">
                      {formT('diffTitle')}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {formT('diffFrom')}
                        </div>
                        <div className="mt-1 font-mono">
                          v{existing.version}
                          {' · '}
                          {existing.tags.join(', ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-primary">
                          {formT('diffTo')}
                        </div>
                        <div className="mt-1 font-mono text-primary">
                          v{currentValues.version}
                          {' · '}
                          {currentValues.tags}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    3
                  </span>
                  <h2 className="text-sm font-semibold">
                    {isUpdate ? t('step3Update') : t('step3')}
                  </h2>
                </div>

                <SubmittingCard state={uploadState} />

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
                    上传 .md 文件后自动填充 frontmatter 到左侧表单
                  </div>
                )}
                {preview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setPreview('')}
                  >
                    清空预览
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

function Showcase({
  mode = 'create' as Mode,
  updateTargetName = 'copywriting',
  tokenState = 'valid' as TokenState,
  uploadState = 'idle' as UploadState,
  showFile = false,
}: {
  mode?: Mode
  updateTargetName?: string
  tokenState?: TokenState
  uploadState?: UploadState
  showFile?: boolean
}) {
  return (
    <div className="theme-my-skills h-screen">
      <AppShell activeNav="upload">
        <SkillUploadPage
          mode={mode}
          updateTargetName={updateTargetName}
          initialTokenState={tokenState}
          initialUploadState={uploadState}
          showFile={showFile}
        />
      </AppShell>
    </div>
  )
}

const meta = {
  title: 'my-skills / 上传页',
  component: Showcase,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'laptop' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Showcase>

export default meta
type Story = StoryObj<typeof meta>

export const v1: Story = {
  tags: ['draft'],
  args: { mode: 'create', tokenState: 'valid', uploadState: 'idle', showFile: false },
}

export const NeedsToken: Story = {
  args: { mode: 'create', tokenState: 'missing', uploadState: 'idle', showFile: false },
}

export const WithFileFilled: Story = {
  args: { mode: 'create', tokenState: 'valid', uploadState: 'idle', showFile: true },
}

export const UpdateMode: Story = {
  args: {
    mode: 'update',
    updateTargetName: 'copywriting',
    tokenState: 'valid',
    uploadState: 'idle',
  },
}

export const Success: Story = {
  args: { mode: 'create', tokenState: 'valid', uploadState: 'success', showFile: true },
}

export const Error: Story = {
  args: { mode: 'create', tokenState: 'valid', uploadState: 'error', showFile: true },
}
