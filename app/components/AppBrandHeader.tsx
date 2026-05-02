import Link from 'next/link'
import type { ReactNode } from 'react'

export interface AppBrandHeaderProps {
  title: string
  subtitle?: string
  /** Back control — matches mobile leading slot */
  showBack?: boolean
  backHref?: string
  leading?: ReactNode
}

export default function AppBrandHeader({
  title,
  subtitle,
  showBack,
  backHref = '/dang-nhap',
  leading,
}: AppBrandHeaderProps) {
  return (
    <header className="relative w-full overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-dark px-app-sm pb-app-md pt-[max(calc(env(safe-area-inset-top)+8px),24px))] shadow-md shadow-brand/20">
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-40 w-64 rounded-full bg-black/5 blur-2xl" aria-hidden />
      <div className="relative">
        {leading != null ? (
          leading
        ) : showBack ? (
          <Link
            href={backHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
            aria-label="Quay lại"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <div className="h-10" aria-hidden />
        )}
      </div>
      <h1 className="relative mt-1 text-[28px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">{title}</h1>
      {subtitle ? <p className="relative mt-2 max-w-md text-base leading-relaxed text-white/80">{subtitle}</p> : null}
    </header>
  )
}
