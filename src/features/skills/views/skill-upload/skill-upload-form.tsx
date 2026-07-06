'use client'

import type { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { SkillFormValues } from '../../schemas'
import type { SkillDetail } from '../../queries'
import { bumpPatchVersion } from '../../hooks/use-skill-upload-controller'

interface SkillUploadFormFieldsProps {
  form: UseFormReturn<SkillFormValues>
  isUpdate: boolean
  updateCtx: SkillDetail | null
  translateZodKey: (key: string) => string
}

export function SkillUploadFormFields({
  form,
  isUpdate,
  updateCtx,
  translateZodKey,
}: SkillUploadFormFieldsProps) {
  const formT = useTranslations('MySkills.upload.form')

  return (
    <>
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
              <Textarea rows={2} placeholder={formT('descriptionPlaceholder')} {...field} />
            </FormControl>
            {fieldState.error?.message && (
              <FormMessage>{translateZodKey(fieldState.error.message)}</FormMessage>
            )}
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <VersionField
          form={form}
          updateCtx={updateCtx}
          translateZodKey={translateZodKey}
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
    </>
  )
}

interface VersionFieldProps {
  form: UseFormReturn<SkillFormValues>
  updateCtx: SkillDetail | null
  translateZodKey: (key: string) => string
}

function VersionField({ form, updateCtx, translateZodKey }: VersionFieldProps) {
  const formT = useTranslations('MySkills.upload.form')
  return (
    <FormField
      control={form.control}
      name="version"
      render={({ field, fieldState }) => {
        const suggested = updateCtx ? bumpPatchVersion(updateCtx.version) : null
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
  )
}
