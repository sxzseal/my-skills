'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  Copy,
  Package,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { MetaSidebar } from '../components/meta-sidebar'
import { TocSidebar } from '../components/toc-sidebar'
import { MarkdownView, getHeadings } from '../components/markdown-view'
import { DeleteSkillModal } from './dialogs/delete-skill.modal'
import type { SkillDetail } from '../queries'

interface SkillDetailViewProps {
  skill: SkillDetail
}

export function SkillDetailView({ skill }: SkillDetailViewProps) {
  const t = useTranslations('MySkills.detail')
  const headings = useMemo(() => getHeadings(skill.content), [skill.content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(skill.content)
      toast.success(t('copySuccess'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const handleDownload = () => {
    const blob = new Blob([skill.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.name}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/40">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('backToList')}
          </Link>
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
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-1.5 h-4 w-4" />
                {t('copy')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                {t('download')}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/upload?mode=update&name=${encodeURIComponent(skill.name)}`}>
                  <Pencil className="mr-1.5 h-4 w-4" />
                  {t('edit')}
                </Link>
              </Button>
              <DeleteSkillModal name={skill.name} displayName={skill.displayName} />
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
            <MarkdownView content={skill.content} />
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
