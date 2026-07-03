import type { Meta, StoryObj } from '@storybook/react'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  Package,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  Tag as TagIcon,
} from 'lucide-react'
import { http, HttpResponse, delay } from 'msw'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AppShell } from './_shared/AppShell'
import './_shared/theme.css'
import {
  SKILL_LIST,
  SKILL_TAGS,
  type SkillSummary,
} from '../../../mocks/fixtures/skills'

function SkillCard({ skill, onOpen }: { skill: SkillSummary; onOpen: (name: string) => void }) {
  const t = useTranslations('MySkills.list')
  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => onOpen(skill.name)}
    >
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Package className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold leading-tight">
                {skill.displayName}
              </div>
              <div className="truncate font-mono text-[11px] text-muted-foreground leading-tight">
                {skill.name}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px] font-mono">
            {t('versionLabel', { version: skill.version })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{skill.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {skill.tags.length > 4 && (
            <Badge variant="secondary" className="text-[10px]">
              +{skill.tags.length - 4}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="truncate">
          {t('updatedAt', { date: skill.updatedAt.slice(0, 10) })}
        </span>
        <span className="font-mono">{(skill.sizeBytes / 1024).toFixed(1)} KB</span>
      </CardFooter>
    </Card>
  )
}

function SkillListPage({
  initialSkills = SKILL_LIST,
  initialTags = SKILL_TAGS,
  state = 'ready' as 'ready' | 'loading' | 'empty' | 'error',
}: {
  initialSkills?: SkillSummary[]
  initialTags?: string[]
  state?: 'ready' | 'loading' | 'empty' | 'error'
}) {
  const t = useTranslations('MySkills.list')
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = initialSkills
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.displayName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }
    if (selectedTag) list = list.filter((s) => s.tags.includes(selectedTag))
    return list
  }, [initialSkills, query, selectedTag])

  const handleOpen = (name: string) => {
    // eslint-disable-next-line no-console
    console.log('open skill:', name)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedTag ?? '__all__'}
              onValueChange={(v) => setSelectedTag(v === '__all__' ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <TagIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={t('tagFilterAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('tagFilterAll')}</SelectItem>
                {initialTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {t('resultCount', { count: filtered.length })}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          {state === 'loading' && <LoadingGrid />}
          {state === 'empty' && <EmptyState />}
          {state === 'error' && <ErrorState />}
          {state === 'ready' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((skill) => (
                <SkillCard key={skill.name} skill={skill} onOpen={handleOpen} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function LoadingGrid() {
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

function EmptyState() {
  const t = useTranslations('MySkills.list')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Package className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground">{t('empty')}</p>
      <Button>
        <UploadCloud className="mr-1.5 h-4 w-4" />
        {t('emptyCta')}
      </Button>
    </div>
  )
}

function ErrorState() {
  const t = useTranslations('MySkills.list')
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-destructive">{t('errorTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">Failed to fetch /api/skills</p>
      </div>
      <Button variant="outline">
        <RefreshCw className="mr-1.5 h-4 w-4" />
        {t('errorRetry')}
      </Button>
    </div>
  )
}

function Showcase({ state = 'ready' as 'ready' | 'loading' | 'empty' | 'error' }) {
  return (
    <div className="theme-my-skills h-screen">
      <AppShell activeNav="list">
        <SkillListPage state={state} />
      </AppShell>
    </div>
  )
}

const meta = {
  title: 'my-skills / 列表页',
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
  args: { state: 'ready' },
}

export const Loading: Story = {
  args: { state: 'loading' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/skills', async () => {
          await delay('infinite')
          return HttpResponse.json({ status_code: 0, data: { list: [], total: 0, tags: [] } })
        }),
      ],
    },
  },
}

export const Empty: Story = {
  args: { state: 'empty' },
}

export const Error: Story = {
  args: { state: 'error' },
}
