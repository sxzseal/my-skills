'use client'

import { useTranslations } from 'next-intl'
import { Github, Hash, Calendar, Package, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SkillDetail } from '../queries'

interface MetaSidebarProps {
  skill: SkillDetail
  sourceUrl?: string
}

export function MetaSidebar({ skill, sourceUrl }: MetaSidebarProps) {
  const t = useTranslations('MySkills.detail.sidebar')
  const items: Array<{
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: React.ReactNode
  }> = [
    { icon: Package, label: t('name'), value: <code className="text-xs">{skill.name}</code> },
    { icon: FileText, label: t('version'), value: <code className="text-xs">v{skill.version}</code> },
    { icon: FileText, label: t('size'), value: `${(skill.sizeBytes / 1024).toFixed(1)} KB` },
    { icon: Calendar, label: t('createdAt'), value: skill.createdAt.slice(0, 10) },
    { icon: Calendar, label: t('updatedAt'), value: skill.updatedAt.slice(0, 10) },
    {
      icon: Hash,
      label: t('sha'),
      value: <code className="text-xs">{skill.sha.slice(0, 10)}…</code>,
    },
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
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 min-w-0"
              >
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
          {sourceUrl && (
            <>
              <Separator />
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Github className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t('sourceLink')}</span>
              </a>
            </>
          )}
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
