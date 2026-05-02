import type { ReactNode } from 'react'
import AppBrandHeader, { type AppBrandHeaderProps } from './AppBrandHeader'

type BrandProps = Pick<AppBrandHeaderProps, 'title' | 'subtitle' | 'showBack' | 'backHref' | 'leading'>

export default function AppAuthShell({ title, subtitle, showBack, backHref, leading, children }: BrandProps & { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-foreground lg:flex-row">
      {/* Desktop: brand column */}
      <aside className="relative hidden min-h-screen w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand via-[#119b8c] to-brand-dark p-app-xl text-white lg:flex lg:max-w-[min(480px,44vw)] lg:shrink-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.14),transparent_50%)]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-0 h-2/3 w-2/3 bg-[radial-gradient(circle_at_100%_100%,rgba(0,0,0,0.12),transparent_55%)]" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Thợ Tốt</p>
        <div className="relative max-w-sm">
          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-5 text-lg font-normal leading-relaxed text-white/88">{subtitle}</p> : null}
        </div>
        <p className="relative text-sm leading-relaxed text-white/60">Bạn trao tôi niềm tin tôi trao bạn tất cả.</p>
      </aside>

      {/* Form column */}
      <div className="flex flex-1 flex-col lg:justify-center lg:bg-surface-lowest lg:px-app-xl lg:py-app-xl">
        <div className="lg:hidden">
          <AppBrandHeader title={title} subtitle={subtitle} showBack={showBack} backHref={backHref} leading={leading} />
        </div>
        <main className="relative z-[1] flex-1 rounded-t-app-sheet bg-surface shadow-[0_-1px_0_rgba(0,0,0,0.05)] lg:mx-auto lg:my-auto lg:flex lg:min-h-0 lg:w-full lg:max-w-md lg:flex-none lg:rounded-app-xl lg:border lg:border-outline-variant/40 lg:bg-surface lg:shadow-float">
          <div className="mx-auto w-full max-w-md px-app-sm pb-app-lg pt-app-md lg:px-app-lg lg:py-app-lg">{children}</div>
        </main>
      </div>
    </div>
  )
}
