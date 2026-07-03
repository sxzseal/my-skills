'use client'

import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { SkillSummary } from '../queries'

interface SkillCardProps {
  skill: SkillSummary
}

export function SkillCard({ skill }: SkillCardProps) {
  const t = useTranslations('MySkills.list')
  return (
    <Link
      href={`/skills/${skill.name}`}
      className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="group relative flex h-full flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
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
    </Link>
  )
}
