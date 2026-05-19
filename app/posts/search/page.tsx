'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import TradeFilter from '@/app/components/SearchFilters/TradeFilter'
import ProvinceFilter from '@/app/components/SearchFilters/ProvinceFilter'
import OccupationFilter from '@/app/components/SearchFilters/OccupationFilter'
import PostSearchResult from '@/app/components/SearchResults/PostSearchResult'
import ProviderSearchResult from '@/app/components/SearchResults/ProviderSearchResult'
import { getOccupationLabel } from '@/lib/api/occupations'
import {
  SearchService,
  type SearchPostItem,
  type SearchProviderItem,
} from '@/lib/api/search.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'posts' | 'providers'

const PAGE_SIZE = 12

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ResultCount({ total, took }: { total: number; took: number }) {
  return (
    <p className="text-xs text-foreground-muted">
      {total.toLocaleString('vi-VN')} kết quả
      <span className="ml-1 opacity-60">({took} ms)</span>
    </p>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-app-xl">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

function EmptyState({ keyword, hint }: { keyword: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center py-app-xl text-center">
      <svg className="mb-app-sm h-16 w-16 text-outline-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p className="font-semibold text-foreground">Không tìm thấy kết quả</p>
      {keyword && (
        <p className="mt-1 text-sm text-foreground-muted">
          Không có kết quả cho &quot;{keyword}&quot;
        </p>
      )}
      {hint ? (
        <p className="mt-1 text-sm text-foreground-muted">{hint}</p>
      ) : (
        <p className="mt-1 text-sm text-foreground-muted">Thử thay đổi bộ lọc hoặc từ khóa</p>
      )}
    </div>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  tab: Tab
  province: string | null
  tradeSlugs: string[]
  mainOccupation: string | null
  onProvinceChange: (v: string | null) => void
  onToggleTrade: (slug: string) => void
  onOccupationChange: (v: string | null) => void
}

function FilterPanel({
  tab,
  province,
  tradeSlugs,
  mainOccupation,
  onProvinceChange,
  onToggleTrade,
  onOccupationChange,
}: FilterPanelProps) {
  return (
    <aside className="flex flex-col gap-app-md">
      <ProvinceFilter value={province} onChange={onProvinceChange} />
      {tab === 'posts' ? (
        <TradeFilter selectedTrades={tradeSlugs} onToggleTrade={onToggleTrade} />
      ) : (
        <OccupationFilter value={mainOccupation} onChange={onOccupationChange} />
      )}
    </aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('posts')

  // Shared filter state
  const [keyword, setKeyword] = useState('')
  const [province, setProvince] = useState<string | null>(null)
  const [tradeSlugs, setTradeSlugs] = useState<string[]>([])
  const [mainOccupation, setMainOccupation] = useState<string | null>(null)

  // Results
  const [posts, setPosts] = useState<SearchPostItem[]>([])
  const [postTotal, setPostTotal] = useState(0)
  const [postTook, setPostTook] = useState(0)
  const [postOffset, setPostOffset] = useState(0)
  const [postHasMore, setPostHasMore] = useState(false)

  const [providers, setProviders] = useState<SearchProviderItem[]>([])
  const [providerTotal, setProviderTotal] = useState(0)
  const [providerTook, setProviderTook] = useState(0)
  const [providerOffset, setProviderOffset] = useState(0)
  const [providerHasMore, setProviderHasMore] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Mobile filter drawer
  const [showFilters, setShowFilters] = useState(false)

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (offset: number, append: boolean) => {
      const setter = append ? setLoadingMore : setLoading
      setter(true)
      setError('')
      try {
        const res = await SearchService.searchPosts({
          title: keyword.trim() || undefined,
          province: province || undefined,
          tradeSlugs: tradeSlugs.length ? tradeSlugs : undefined,
          sortBy: 'createdAt',
          order: 'desc',
          limit: PAGE_SIZE,
          offset,
        })
        setPosts((prev) => (append ? [...prev, ...res.data] : res.data))
        setPostTotal(res.total)
        setPostTook(res.took)
        setPostOffset(offset)
        setPostHasMore(res.hasMore)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi tìm kiếm bài đăng')
      } finally {
        setter(false)
      }
    },
    [keyword, province, tradeSlugs],
  )

  const fetchProviders = useCallback(
    async (offset: number, append: boolean) => {
      const setter = append ? setLoadingMore : setLoading
      setter(true)
      setError('')
      try {
        const res = await SearchService.searchProviders({
          displayName: keyword.trim() || undefined,
          province: province || undefined,
          mainOccupation: mainOccupation || undefined,
          sortBy: 'createdAt',
          order: 'desc',
          limit: PAGE_SIZE,
          offset,
        })
        setProviders((prev) => (append ? [...prev, ...res.data] : res.data))
        setProviderTotal(res.total)
        setProviderTook(res.took)
        setProviderOffset(offset)
        setProviderHasMore(res.hasMore)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi tìm kiếm thợ')
      } finally {
        setter(false)
      }
    },
    [keyword, province, mainOccupation],
  )

  // ── Debounced search on filter change (fresh fetch) ───────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (tab === 'posts') {
        void fetchPosts(0, false)
      } else {
        void fetchProviders(0, false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, keyword, province, tradeSlugs, mainOccupation])

  // ── Tab switch: reset results ──────────────────────────────────────────────

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    setError('')
    if (newTab === 'providers') {
      setTradeSlugs([])
    }
  }

  // ── Filter handlers ────────────────────────────────────────────────────────

  const handleToggleTrade = (slug: string) => {
    setTradeSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const handleResetFilters = () => {
    setProvince(null)
    setTradeSlugs([])
    setMainOccupation(null)
  }

  const hasActiveFilters = !!province || tradeSlugs.length > 0 || !!mainOccupation

  // ── Load more ─────────────────────────────────────────────────────────────

  const handleLoadMorePosts = () => fetchPosts(postOffset + PAGE_SIZE, true)
  const handleLoadMoreProviders = () => fetchProviders(providerOffset + PAGE_SIZE, true)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="min-h-screen bg-surface-lowest">

        <main className="app-container py-app-md">
          {/* Page heading */}
          <div className="mb-app-md">
            <h1 className="text-xl font-bold text-foreground">Tìm kiếm</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Tìm thợ và bài đăng dịch vụ phù hợp với bạn
            </p>
          </div>

          {/* Search input */}
          <div className="relative mb-app-sm">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={tab === 'posts' ? 'Tìm bài đăng...' : 'Tìm tên thợ...'}
              className="w-full rounded-app-lg border border-outline-variant/80 bg-surface py-app-sm pl-10 pr-app-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 transition-[border-color,box-shadow]"
              aria-label="Từ khóa tìm kiếm"
            />
          </div>

          {/* Tabs */}
          <div className="mb-app-md flex gap-1 rounded-app-lg border border-outline-variant/60 bg-surface p-1">
            {([['posts', 'Bài đăng'], ['providers', 'Thợ']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTabChange(value)}
                className={`flex-1 rounded-app-md py-2 text-sm font-semibold transition-all duration-200 ${
                  tab === value
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-foreground-muted hover:bg-brand-tint/40 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <div className="mb-app-sm flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-app-lg border border-outline-variant/60 bg-surface px-app-sm py-2 text-sm text-foreground transition-colors hover:border-brand/30 hover:bg-brand-tint/40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Bộ lọc
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {tradeSlugs.length + (province ? 1 : 0) + (mainOccupation ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-brand hover:text-brand-dark"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="mb-app-md rounded-app-lg border border-outline-variant/60 bg-surface p-app-md lg:hidden">
              <FilterPanel
                tab={tab}
                province={province}
                tradeSlugs={tradeSlugs}
                mainOccupation={mainOccupation}
                onProvinceChange={setProvince}
                onToggleTrade={handleToggleTrade}
                onOccupationChange={setMainOccupation}
              />
            </div>
          )}

          {/* Main grid: desktop sidebar + results */}
          <div className="grid gap-app-md lg:grid-cols-[280px_1fr]">
            {/* Desktop filter sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-4 rounded-app-lg border border-outline-variant/60 bg-surface p-app-md">
                <div className="mb-app-sm flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Bộ lọc</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-brand hover:text-brand-dark"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>
                <FilterPanel
                  tab={tab}
                  province={province}
                  tradeSlugs={tradeSlugs}
                  mainOccupation={mainOccupation}
                  onProvinceChange={setProvince}
                  onToggleTrade={handleToggleTrade}
                  onOccupationChange={setMainOccupation}
                />
              </div>
            </div>

            {/* Results column */}
            <section aria-live="polite">
              {/* Error */}
              {error && (
                <div className="mb-app-md rounded-app-lg border border-app-error/30 bg-red-50 px-app-md py-app-sm text-sm text-app-error">
                  {error}
                </div>
              )}

              {/* Loading (initial) */}
              {loading && <Spinner />}

              {/* Posts results */}
              {!loading && tab === 'posts' && (
                <>
                  {posts.length > 0 && (
                    <ResultCount total={postTotal} took={postTook} />
                  )}
                  <div className="mt-app-sm flex flex-col gap-app-sm">
                    {posts.map((post) => (
                      <PostSearchResult key={post.id} post={post} />
                    ))}
                  </div>
                  {posts.length === 0 && !error && <EmptyState keyword={keyword} />}
                  {postHasMore && (
                    <div className="mt-app-md flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMorePosts}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-app-lg border border-outline-variant/60 bg-surface px-app-md py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/30 hover:bg-brand-tint/40 disabled:opacity-60"
                      >
                        {loadingMore ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                            Đang tải...
                          </>
                        ) : (
                          `Xem thêm (còn ${postTotal - posts.length})`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Providers results */}
              {!loading && tab === 'providers' && (
                <>
                  {providers.length > 0 && (
                    <ResultCount total={providerTotal} took={providerTook} />
                  )}
                  <div className="mt-app-sm flex flex-col gap-app-sm">
                    {providers.map((provider) => (
                      <ProviderSearchResult key={provider.id} provider={provider} />
                    ))}
                  </div>
                  {providers.length === 0 && !error && (
                    <EmptyState
                      keyword={keyword}
                      hint={
                        mainOccupation
                          ? `Chưa có thợ nào đăng ký nghề "${getOccupationLabel(mainOccupation) ?? mainOccupation}". Thử bỏ lọc nghề để xem tất cả thợ.`
                          : province
                          ? `Chưa có thợ nào tại ${province}. Thử chọn tỉnh/thành khác.`
                          : undefined
                      }
                    />
                  )}
                  {providerHasMore && (
                    <div className="mt-app-md flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMoreProviders}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-app-lg border border-outline-variant/60 bg-surface px-app-md py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/30 hover:bg-brand-tint/40 disabled:opacity-60"
                      >
                        {loadingMore ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                            Đang tải...
                          </>
                        ) : (
                          `Xem thêm (còn ${providerTotal - providers.length})`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
