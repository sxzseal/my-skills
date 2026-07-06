'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import {
  skillFormSchema,
  parseTagsInput,
  type SkillFormValues,
} from '../schemas'
import { upsertSkillRequest } from '../mutations'
import type { SkillDetail } from '../queries'
import type { TokenState } from '../components/token-panel'
import type { UploadState } from '../components/upload-result-card'
import { RequestError } from '@/lib/request'

const DEFAULT_FORM: SkillFormValues = {
  name: '',
  displayName: '',
  description: '',
  version: '0.1.0',
  tags: '',
}

export function bumpPatchVersion(v: string): string {
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

interface UseSkillUploadControllerArgs {
  mode: 'create' | 'update'
  existing: SkillDetail | null
}

export interface SkillUploadController {
  form: UseFormReturn<SkillFormValues>
  isUpdate: boolean
  /** Narrowed to SkillDetail when isUpdate is true; null otherwise. */
  updateCtx: SkillDetail | null
  tokenState: TokenState
  setTokenState: (s: TokenState) => void
  file: File | null
  preview: string
  setPreview: (v: string) => void
  uploadState: UploadState
  commitSha: string | undefined
  errorMessage: string | undefined
  isSubmitting: boolean
  canSubmit: boolean
  translateZodKey: (key: string) => string
  handleFileChange: (f: File | null) => Promise<void>
  onSubmit: (values: SkillFormValues) => Promise<void>
  resetForNewUpload: () => void
  resetErrorState: () => void
}

export function useSkillUploadController({
  mode,
  existing,
}: UseSkillUploadControllerArgs): SkillUploadController {
  const formT = useTranslations('MySkills.upload.form')
  const resultT = useTranslations('MySkills.upload.result')
  const translateZodKey = useZodErrorTranslator()
  const readFileAsText = useFileReader()
  const router = useRouter()

  const isUpdate = mode === 'update' && existing !== null
  const updateCtx: SkillDetail | null = isUpdate ? existing : null

  const [tokenState, setTokenState] = useState<TokenState>('missing')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(updateCtx?.content ?? '')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [commitSha, setCommitSha] = useState<string | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const initialValues = useMemo<SkillFormValues>(() => {
    if (updateCtx) {
      return {
        name: updateCtx.name,
        displayName: updateCtx.displayName,
        description: updateCtx.description,
        version: bumpPatchVersion(updateCtx.version),
        tags: updateCtx.tags.join(', '),
      }
    }
    return { ...DEFAULT_FORM }
  }, [updateCtx])

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  })

  const canSubmit =
    tokenState === 'valid' &&
    (isUpdate || (file !== null && preview.trim().length > 0)) &&
    !form.formState.isSubmitting

  const isSubmitting = uploadState === 'submitting' || form.formState.isSubmitting

  const handleFileChange = async (f: File | null) => {
    setFile(f)
    if (!f) {
      if (!updateCtx) setPreview('')
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

  const resolveContentToSubmit = (): string => {
    if (preview.trim().length > 0) return preview
    if (updateCtx) return updateCtx.content
    return ''
  }

  const onSubmit = async (values: SkillFormValues) => {
    setUploadState('submitting')
    setErrorMessage(undefined)
    try {
      const result = await upsertSkillRequest({
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        version: values.version,
        tags: parseTagsInput(values.tags),
        content: resolveContentToSubmit(),
        sha: updateCtx?.sha,
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

  const resetForNewUpload = () => {
    setUploadState('idle')
    setCommitSha(undefined)
    if (!updateCtx) {
      form.reset(DEFAULT_FORM)
      setFile(null)
      setPreview('')
    }
  }

  const resetErrorState = () => {
    setUploadState('idle')
  }

  return {
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
  }
}
