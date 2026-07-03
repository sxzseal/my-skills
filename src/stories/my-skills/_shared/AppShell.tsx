'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Cloud, LayoutGrid, Upload, HelpCircle, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AppShellProps {
  children: ReactNode
  activeNav?: 'list' | 'upload' | 'docs'
  onNavigate?: (target: 'list' | 'upload' | 'docs') => void
}

export function AppShell({ children, activeNav = 'list', onNavigate }: AppShellProps) {
  const t = useTranslations('MySkills')

  const navItems = [
    { key: 'list' as const, label: t('nav.list'), icon: LayoutGrid },
    { key: 'docs' as const, label: t('nav.docs'), icon: HelpCircle },
  ]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Cloud className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">
                {t('brand')}
              </div>
              <div className="truncate text-[11px] text-muted-foreground leading-tight">
                {t('tagline')}
              </div>
            </div>
          </div>

          <nav className="ml-6 flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.key === activeNav
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate?.(item.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              {t('list.downloadAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('upload')}>
              <Upload className="mr-1.5 h-4 w-4" />
              {t('list.uploadNew')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
