import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { AppShell } from '@/features/skills/components/app-shell'
import { Toaster } from '@/components/ui/sonner'
import '@/features/skills/theme.css'

interface HubLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function HubLayout({ children, params }: HubLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="theme-my-skills h-screen">
      <AppShell activeNav="list">{children}</AppShell>
      <Toaster />
    </div>
  )
}
