'use client'

import { useState } from 'react'
import { WORKER_OCCUPATIONS, OCCUPATION_CATEGORIES, getOccupationLabel } from '@/lib/api/occupations'

interface OccupationFilterProps {
  value: string | null
  onChange: (value: string | null) => void
}

export default function OccupationFilter({ value, onChange }: OccupationFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const occupationsByCategory = WORKER_OCCUPATIONS.reduce(
    (acc, occ) => {
      if (!acc[occ.category]) acc[occ.category] = []
      acc[occ.category].push(occ)
      return acc
    },
    {} as Record<string, typeof WORKER_OCCUPATIONS>,
  )

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const selectedLabel = value ? getOccupationLabel(value) : null

  return (
    <div className="flex flex-col gap-app-xs">
      <label className="text-sm font-semibold text-foreground">Nghề chính</label>

      {selectedLabel && (
        <div className="flex items-center gap-1 rounded-app-lg bg-brand-tint px-app-sm py-1.5 text-xs text-brand-dark">
          <span className="flex-1 truncate">{selectedLabel}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex-shrink-0 text-brand hover:text-brand-dark"
            aria-label="Xóa nghề chính"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-app-xs rounded-app-lg border border-outline-variant/60 bg-surface p-app-sm">
        {/* All / reset option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex w-full items-center rounded-app-md px-app-xs py-1.5 text-sm transition-colors ${
            !value
              ? 'bg-brand text-white'
              : 'text-foreground-muted hover:bg-surface-highest/60'
          }`}
        >
          Tất cả nghề
        </button>

        {OCCUPATION_CATEGORIES.map((category) => {
          const items = occupationsByCategory[category] ?? []
          if (items.length === 0) return null
          const isOpen = expandedCategories.has(category)
          const hasSelected = items.some((o) => o.value === value)

          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className={`flex w-full items-center justify-between rounded-app-md px-app-xs py-1.5 text-sm font-medium transition-colors ${
                  hasSelected
                    ? 'text-brand'
                    : 'text-foreground hover:bg-surface-highest/60'
                }`}
              >
                <span className="truncate">{category}</span>
                <svg
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                  {items.map((occ) => (
                    <button
                      key={occ.value}
                      type="button"
                      onClick={() => onChange(value === occ.value ? null : occ.value)}
                      className={`flex w-full items-center gap-app-xs rounded-app-md px-app-xs py-1.5 text-left text-sm transition-colors ${
                        value === occ.value
                          ? 'bg-brand text-white'
                          : 'text-foreground hover:bg-surface-highest/60'
                      }`}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
