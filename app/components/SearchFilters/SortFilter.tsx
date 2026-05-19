'use client'

interface SortFilterProps {
    sortBy: string
    order: 'asc' | 'desc'
    onSortChange: (sortBy: string, order: 'asc' | 'desc') => void
    options: Array<{ label: string; value: string }>
}

export default function SortFilter({ sortBy, order, onSortChange, options }: SortFilterProps) {
    return (
        <div className="flex flex-col gap-app-xs">
            <label className="text-sm font-semibold text-foreground">Sắp xếp</label>

            <div className="flex gap-app-sm">
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value, order)}
                    className="flex-1 rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-2.5 text-sm text-foreground transition-[border-color] hover:border-outline-variant focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/18"
                >
                    <option value="">Mặc định</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={() => onSortChange(sortBy, order === 'asc' ? 'desc' : 'asc')}
                    className="inline-flex items-center gap-1 rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-2.5 text-foreground transition-colors hover:border-brand/30 hover:bg-brand-tint/40"
                    title={order === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                >
                    {order === 'asc' ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20a1 1 0 001 1h16a1 1 0 001-1V7.414a1 1 0 00-.293-.707l-6.414-6.414a1 1 0 00-.707-.293H4a1 1 0 00-1 1v16z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
