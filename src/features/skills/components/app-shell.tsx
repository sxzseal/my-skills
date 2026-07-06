'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Cloud, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleSwitcher } from '@/components/locale-switcher'

type NavKey = 'list' | 'upload' | 'docs'

interface AppShellProps {
  children: ReactNode
  activeNav?: NavKey
}

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations('MySkills')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Cloud className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{t('brand')}</div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">
                {t('tagline')}
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              {t('list.downloadAll')}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/upload">
                <Upload className="mr-1.5 h-4 w-4" />
                {t('list.uploadNew')}
              </Link>
            </Button>
            <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
