'use client'

import { useEffect, useState } from 'react'
import { SearchService } from '@/lib/api/search.service'

interface ProvinceFilterProps {
  value: string | null
  onChange: (province: string | null) => void
}

export default function ProvinceFilter({ value, onChange }: ProvinceFilterProps) {
  const [provinces, setProvinces] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true)
        const response = await SearchService.getProvinces()
        setProvinces(response.provinces ?? [])
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách tỉnh/thành phố')
        setProvinces([])
      } finally {
        setLoading(false)
      }
    }
    loadProvinces()
  }, [])

  return (
    <div className="flex flex-col gap-app-xs">
      <label className="text-sm font-semibold text-foreground">Tỉnh / Thành phố</label>
      {loading ? (
        <div className="h-10 animate-pulse rounded-app-lg bg-surface-highest" />
      ) : error ? (
        <p className="text-xs text-app-error">{error}</p>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="rounded-app-lg border border-outline-variant/80 bg-surface px-app-sm py-2.5 text-sm text-foreground transition-[border-color] hover:border-outline-variant focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/18"
        >
          <option value="">Tất cả tỉnh / thành phố</option>
          {provinces.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
