'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import Header from '@/app/components/Header'
import { SearchService, type GlobalSearchResponse } from '@/lib/api/search.service'

const trending = [
  { text: 'Thợ điện', icon: '⚡' },
  { text: 'Sửa điều hòa', icon: '❄️' },
  { text: 'Sơn nhà', icon: '🎨' },
  { text: 'Thợ mộc', icon: '🔨' },
  { text: 'Vệ sinh máy lạnh', icon: '🧹' },
]

export default function SearchPostsPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<GlobalSearchResponse | null>(null)

  const run = useCallback(async (query: string) => {
    const t = query.trim()
    if (t.length < 2) {
      setErr('Nhập ít nhất 2 ký tự')
      setData(null)
      return
    }
    setErr('')
    setLoading(true)
    try {
      const res = await SearchService.globalSearch({ q: t, limit: 12 })
      setData(res)
    } catch (e: unknown) {
      setData(null)
      setErr(e instanceof Error ? e.message : 'Không thể tìm kiếm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) {
        setData(null)
        setErr('')
        return
      }
      void run(q)
    }, 350)
    return () => clearTimeout(t)
  }, [q, run])

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest">
        <Header />
        <main className="app-container max-w-3xl py-app-md">
          <h1 className="text-xl font-bold text-foreground">Tìm kiếm</h1>
          <p className="mt-1 text-sm text-foreground-muted">Thợ, bài đăng và dịch vụ — đồng bộ với ứng dụng di động</p>

          <div className="relative mt-app-md">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nhập từ khóa..."
              className="w-full rounded-app-lg border border-outline-variant bg-surface-highest/45 py-app-sm pl-10 pr-app-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              aria-label="Từ khóa tìm kiếm"
            />
          </div>

          <div className="mt-app-md flex flex-wrap gap-app-xs">
            {trending.map((item) => (
              <button
                key={item.text}
                type="button"
                onClick={() => setQ(item.text)}
                className="inline-flex items-center gap-1 rounded-app-lg border border-outline-variant/60 bg-surface px-app-sm py-app-xs text-sm text-foreground transition-colors hover:border-brand/40 hover:bg-brand-tint/50"
              >
                <span>{item.icon}</span>
                {item.text}
              </button>
            ))}
          </div>

          {err ? (
            <p className="mt-app-md text-sm text-app-error" role="alert">
              {err}
            </p>
          ) : null}

          {loading ? (
            <div className="mt-app-lg flex justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : null}

          {!loading && data && (data.providers?.length || data.posts?.length) ? (
            <ul className="mt-app-md divide-y divide-outline-variant/40 rounded-app-md border border-outline-variant/60 bg-surface">
              {(data.providers || []).map((p) => (
                <li key={`p-${p.id}`}>
                  <Link
                    href={`/profile/${p.id}`}
                    className="flex items-center gap-app-sm px-app-sm py-3 transition-colors hover:bg-brand-tint/40"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-sm font-bold text-brand-dark">
                      {(p.displayName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{p.displayName || 'Thợ'}</p>
                      <p className="truncate text-xs text-foreground-muted">{p.province || 'Thợ dịch vụ'}</p>
                    </div>
                  </Link>
                </li>
              ))}
              {(data.posts || []).map((post: { id?: string; title?: string; province?: string }) => (
                <li key={`post-${post.id}`}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="block px-app-sm py-3 transition-colors hover:bg-brand-tint/40"
                  >
                    <p className="font-medium text-foreground">{post.title || 'Bài đăng'}</p>
                    <p className="text-xs text-foreground-muted">{post.province || 'Bài đăng dịch vụ'}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && q.trim().length >= 2 && data && !data.providers?.length && !data.posts?.length ? (
            <p className="mt-app-md text-center text-sm text-foreground-muted">Không có kết quả</p>
          ) : null}

          <p className="mt-app-lg text-center text-xs text-foreground-muted">
            <button type="button" className="font-semibold text-brand hover:text-brand-dark" onClick={() => router.push('/home')}>
              Về trang chủ
            </button>
          </p>
        </main>
      </div>
    </AppShell>
  )
}
