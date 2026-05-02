'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const destinations = [
  { href: '/home', label: 'Trang chủ', match: (p: string) => p === '/home' || p === '/', icon: HomeIcon },
  { href: '/posts/search', label: 'Tìm kiếm', match: (p: string) => p.startsWith('/posts/search'), icon: SearchIcon },
  { href: '/tin-nhan', label: 'Tin nhắn', match: (p: string) => p.startsWith('/tin-nhan'), icon: MessageIcon },
  { href: '/thong-bao', label: 'Thông báo', match: (p: string) => p.startsWith('/thong-bao'), icon: BellIcon },
  { href: '/profile', label: 'Cá nhân', match: (p: string) => p.startsWith('/profile'), icon: UserIcon },
]

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {active ? (
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      ) : (
        <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      )}
    </svg>
  )
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function MessageIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function MobileBottomNav() {
  const pathname = usePathname() || ''

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-app-nav items-stretch justify-around border-t border-outline-variant/40 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-app-nav backdrop-blur-lg md:hidden"
      style={{ height: 'var(--app-bottom-nav-height)' }}
      aria-label="Điều hướng chính"
    >
      {destinations.map(({ href, label, match, icon: Icon }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={`mx-0.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-app-lg px-1 py-1.5 text-[11px] font-medium tracking-tight transition-all duration-app-fast ease-app-emphasized sm:text-xs ${
              active
                ? 'bg-brand-tint/90 font-semibold text-brand-dark shadow-sm'
                : 'text-foreground-muted hover:bg-surface-highest/80 hover:text-brand-dark'
            }`}
          >
            <Icon active={active} />
            <span className="max-w-[4.5rem] truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
