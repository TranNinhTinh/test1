'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import ProviderReceivedReviewsPanel from '@/app/components/ProviderReceivedReviewsPanel'
import { AuthService } from '@/lib/api/auth.service'
import { ProfileService } from '@/lib/api/profile-new.service'

export default function DanhGiaVeToiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightReviewId = searchParams.get('highlightReviewId') || null
  const [ready, setReady] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [isProvider, setIsProvider] = useState(false)
  const [loadErr, setLoadErr] = useState('')

  useEffect(() => {
    void (async () => {
      if (!AuthService.isAuthenticated()) {
        router.replace('/dang-nhap')
        return
      }
      try {
        const me = await ProfileService.getMyProfile()
        const role = (me.role || '').toLowerCase()
        setIsProvider(role === 'provider')
        setProviderId(me.id)
        if (role !== 'provider') {
          setLoadErr('Trang này chỉ dành cho tài khoản thợ (provider).')
        }
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : 'Không tải được hồ sơ')
      } finally {
        setReady(true)
      }
    })()
  }, [router])

  if (!ready) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col bg-slate-50">
          <div className="flex flex-1 items-center justify-center p-8 text-slate-600">Đang tải...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Đánh giá về tôi</h1>
              <p className="mt-1 text-sm text-slate-600">Khách để lại sau khi hoàn thành đơn hàng</p>
            </div>
            <Link
              href="/home"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> Về trang chủ
            </Link>
          </div>

          {loadErr && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadErr}{' '}
              <Link href="/profile" className="font-semibold text-indigo-700 underline">
                Hồ sơ
              </Link>
            </div>
          )}

          {isProvider && providerId && (
            <ProviderReceivedReviewsPanel
              providerId={providerId}
              highlightReviewId={highlightReviewId}
            />
          )}
        </main>
      </div>
    </AppShell>
  )
}
