'use client'

import { useEffect, useRef, useTransition } from 'react'
import { Search, Tag as TagIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

const ALL_TAGS_VALUE = '__all__'
const DEBOUNCE_MS = 250

interface SkillFiltersProps {
  tags: string[]
  resultCount: number
  initialQuery: string
  initialTag: string
}

function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  return (...args: Args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => fnRef.current(...args), delay)
  }
}

export function SkillFilters({
  tags,
  resultCount,
  initialQuery,
  initialTag,
}: SkillFiltersProps) {
  const t = useTranslations('MySkills.list')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParams = (patch: { q?: string; tag?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (patch.q !== undefined) {
      if (patch.q) params.set('q', patch.q)
      else params.delete('q')
    }
    if (patch.tag !== undefined) {
      if (patch.tag) params.set('tag', patch.tag)
      else params.delete('tag')
    }
    const qs = params.toString()
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
    })
  }

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    updateParams({ q: value })
  }, DEBOUNCE_MS)

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[240px] flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={initialQuery}
          onChange={(e) => debouncedSetQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
          aria-label={t('searchPlaceholder')}
        />
      </div>
      <Select
        value={initialTag || ALL_TAGS_VALUE}
        onValueChange={(v) => updateParams({ tag: v === ALL_TAGS_VALUE ? '' : v })}
      >
        <SelectTrigger className="w-[180px]">
          <TagIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder={t('tagFilterAll')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TAGS_VALUE}>{t('tagFilterAll')}</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
        {t('resultCount', { count: resultCount })}
      </span>
    </div>
  )
}
