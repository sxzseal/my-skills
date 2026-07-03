import type { Meta, StoryObj } from '@storybook/react'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Download,
  Copy,
  Trash2,
  Github,
  Hash,
  Calendar,
  Package,
  FileText,
  Loader2,
  AlertCircle,
  Pencil,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { AppShell } from './_shared/AppShell'
import './_shared/theme.css'
import { SKILL_DETAILS, type SkillDetail } from '../../../mocks/fixtures/skills'

interface HeadingItem {
  id: string
  text: string
  level: number
}

function extractHeadings(md: string): HeadingItem[] {
  const lines = md.split('\n')
  const items: HeadingItem[] = []
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
    items.push({ id, text, level })
  }
  return items
}

function MetaSidebar({ skill }: { skill: SkillDetail }) {
  const t = useTranslations('MySkills.detail.sidebar')
  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }> = [
    { icon: Package, label: t('name'), value: <code className="text-xs">{skill.name}</code> },
    { icon: FileText, label: t('version'), value: <code className="text-xs">v{skill.version}</code> },
    { icon: FileText, label: t('size'), value: `${(skill.sizeBytes / 1024).toFixed(1)} KB` },
    { icon: Calendar, label: t('createdAt'), value: skill.createdAt.slice(0, 10) },
    { icon: Calendar, label: t('updatedAt'), value: skill.updatedAt.slice(0, 10) },
    { icon: Hash, label: t('sha'), value: <code className="text-xs">{skill.sha.slice(0, 10)}…</code> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="text-sm font-semibold">{t('meta')}</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 px-4 pb-4 text-sm">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{item.label}</span>
                </div>
                <div className="min-w-0 truncate text-right text-xs font-medium">
                  {item.value}
                </div>
              </div>
            )
          })}
          <Separator />
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {t('tags')}
            </div>
            <div className="flex flex-wrap gap-1">
              {skill.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="max-w-full truncate text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Github className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t('sourceLink')}</span>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="text-sm font-semibold">Frontmatter</div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
            <code>{skill.frontmatterRaw}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

function TocSidebar({ headings }: { headings: HeadingItem[] }) {
  const t = useTranslations('MySkills.detail')
  if (headings.length === 0) return null
  return (
    <div className="sticky top-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('toc')}
      </div>
      <ul className="space-y-1 text-sm">
        {headings.map((h, i) => (
          <li key={`${h.id}-${i}`}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block truncate rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                h.level === 2 && 'pl-4',
                h.level === 3 && 'pl-6 text-xs',
                i === 0 && 'bg-accent text-accent-foreground font-medium',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SkillDetailPage({ skill }: { skill: SkillDetail | null }) {
  const t = useTranslations('MySkills.detail')

  if (!skill) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold">{t('notFoundTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('notFoundDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  const headings = useMemo(() => extractHeadings(skill.content), [skill.content])

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('backToList')}
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-tight">
                    {skill.displayName}
                  </h1>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="font-mono">{skill.name}</code>
                    <span>·</span>
                    <span>v{skill.version}</span>
                    <span>·</span>
                    <span>{(skill.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{skill.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                <Copy className="mr-1.5 h-4 w-4" />
                {t('copy')}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                {t('download')}
              </Button>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-4 w-4" />
                {t('edit')}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {t('delete')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                    <DialogDescription>{t('deleteConfirmDesc')}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">{t('deleteConfirmNo')}</Button>
                    <Button variant="destructive">{t('deleteConfirmYes')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] xl:grid-cols-[minmax(160px,200px)_minmax(0,1fr)_minmax(240px,280px)]">
        <div className="hidden xl:block min-w-0 overflow-y-auto border-r border-border">
          <div className="px-5 py-6">
            <TocSidebar headings={headings} />
          </div>
        </div>

        <div className="min-w-0 overflow-y-auto">
          <article className="mx-auto max-w-3xl px-6 py-6">
            <div className="cf-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.content}</ReactMarkdown>
            </div>
          </article>
        </div>

        <div className="hidden md:block min-w-0 overflow-y-auto border-l border-border">
          <div className="px-5 py-6">
            <MetaSidebar skill={skill} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingShowcase() {
  return (
    <div className="theme-my-skills h-screen">
      <AppShell activeNav="list">
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading skill…
        </div>
      </AppShell>
    </div>
  )
}

function Showcase({
  skillKey = 'copywriting',
  state = 'ready' as 'ready' | 'loading' | 'not-found',
}) {
  if (state === 'loading') return <LoadingShowcase />
  const skill = state === 'not-found' ? null : SKILL_DETAILS[skillKey] ?? null
  return (
    <div className="theme-my-skills h-screen">
      <AppShell activeNav="list">
        <SkillDetailPage skill={skill} />
      </AppShell>
    </div>
  )
}

const meta = {
  title: 'my-skills / 详情页',
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
  args: { skillKey: 'copywriting', state: 'ready' },
}

export const DailyReport: Story = {
  args: { skillKey: 'daily-report', state: 'ready' },
}

export const Loading: Story = {
  args: { state: 'loading' },
}

export const NotFound: Story = {
  args: { state: 'not-found' },
}
