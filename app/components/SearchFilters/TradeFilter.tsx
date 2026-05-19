'use client'

import { useEffect, useState } from 'react'
import { SearchService, type TradeDto } from '@/lib/api/search.service'

interface TradeFilterProps {
  selectedTrades: string[]
  onToggleTrade: (slug: string) => void
}

export default function TradeFilter({ selectedTrades, onToggleTrade }: TradeFilterProps) {
  const [trades, setTrades] = useState<Array<Omit<TradeDto, 'yearsExperience'>>>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setLoading(true)
        const response = await SearchService.getTrades()
        setTrades(response.trades ?? [])
        setCategories(response.categories ?? [])
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách ngành nghề')
      } finally {
        setLoading(false)
      }
    }
    loadTrades()
  }, [])

  const tradesByCategory = trades.reduce(
    (acc, trade) => {
      const cat = trade.category || 'Khác'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(trade)
      return acc
    },
    {} as Record<string, Array<Omit<TradeDto, 'yearsExperience'>>>,
  )

  // Use server-provided order; fallback to sorted keys if backend gives none
  const orderedCategories = categories.length > 0 ? categories : Object.keys(tradesByCategory).sort()

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-app-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-app-lg bg-surface-highest" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-xs text-app-error">{error}</p>
  }

  if (orderedCategories.length === 0) return null

  return (
    <div className="flex flex-col gap-app-xs">
      <label className="text-sm font-semibold text-foreground">Ngành nghề / Dịch vụ</label>
      <div className="flex flex-col gap-app-xs rounded-app-lg border border-outline-variant/60 bg-surface p-app-sm">
        {orderedCategories.map((category) => {
          const items = tradesByCategory[category] ?? []
          if (items.length === 0) return null
          const isOpen = expandedCategories.has(category)
          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between rounded-app-md px-app-xs py-1.5 text-sm font-medium text-foreground hover:bg-surface-highest/60"
              >
                <span>{category}</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="ml-app-sm flex flex-col gap-app-xs border-l border-outline-variant/40 py-app-xs pl-app-sm">
                  {items.map((trade) => (
                    <label key={trade.slug} className="flex cursor-pointer items-center gap-app-xs">
                      <input
                        type="checkbox"
                        checked={selectedTrades.includes(trade.slug)}
                        onChange={() => onToggleTrade(trade.slug)}
                        className="h-4 w-4 cursor-pointer rounded accent-brand"
                      />
                      <span className="text-sm text-foreground">
                        {trade.icon ? `${trade.icon} ` : ''}
                        {trade.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedTrades.length > 0 && (
        <button
          type="button"
          onClick={() => selectedTrades.forEach((s) => onToggleTrade(s))}
          className="mt-0.5 self-start text-xs text-brand hover:text-brand-dark"
        >
          Bỏ chọn tất cả ({selectedTrades.length})
        </button>
      )}
    </div>
  )
}
