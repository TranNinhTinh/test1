'use client'

import type { ReactNode } from 'react'
import MobileBottomNav from './MobileBottomNav'

/**
 * Web shell: full-width content like a typical website.
 * Bottom tab bar only on small phones (&lt; md) — colors stay aligned with the mobile app.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-lowest">
      <div className="flex min-h-screen flex-col pb-[var(--app-bottom-nav-height)] md:pb-0">{children}</div>
      <MobileBottomNav />
    </div>
  )
}
