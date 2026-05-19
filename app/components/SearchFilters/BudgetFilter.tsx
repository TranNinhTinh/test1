'use client'

import AppField from '@/app/components/ui/AppField'

interface BudgetFilterProps {
    minBudget: number | null
    maxBudget: number | null
    onMinChange: (value: number | null) => void
    onMaxChange: (value: number | null) => void
}

const COMMON_BUDGETS = [100000, 250000, 500000, 1000000, 2000000, 5000000]

export default function BudgetFilter({ minBudget, maxBudget, onMinChange, onMaxChange }: BudgetFilterProps) {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? parseInt(e.target.value, 10) : null
        onMinChange(value)
    }

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? parseInt(e.target.value, 10) : null
        onMaxChange(value)
    }

    const formatBudget = (value: number) => {
        if (value >= 1000000) return `${Math.floor(value / 1000000)}M`
        if (value >= 1000) return `${Math.floor(value / 1000)}K`
        return String(value)
    }

    return (
        <div className="flex flex-col gap-app-xs">
            <label className="text-sm font-semibold text-foreground">Khoảng giá (VNĐ)</label>

            <div className="grid grid-cols-2 gap-app-sm">
                <AppField
                    type="number"
                    placeholder="Từ"
                    value={minBudget || ''}
                    onChange={handleMinChange}
                    className="text-sm"
                />
                <AppField
                    type="number"
                    placeholder="Đến"
                    value={maxBudget || ''}
                    onChange={handleMaxChange}
                    className="text-sm"
                />
            </div>

            <div className="flex flex-wrap gap-app-xs pt-app-xs">
                {COMMON_BUDGETS.map((budget) => (
                    <button
                        key={budget}
                        type="button"
                        onClick={() => {
                            if (!maxBudget || budget <= maxBudget) {
                                onMinChange(budget)
                            }
                        }}
                        className={`rounded-app-md px-app-sm py-1 text-xs font-medium transition-colors ${minBudget === budget
                                ? 'bg-brand text-white'
                                : 'border border-outline-variant/60 bg-surface text-foreground hover:border-brand/30 hover:bg-brand-tint/40'
                            }`}
                    >
                        {formatBudget(budget)}+
                    </button>
                ))}
            </div>
        </div>
    )
}
