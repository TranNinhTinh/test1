'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import ProviderReceivedReviewsPanel from '@/app/components/ProviderReceivedReviewsPanel'
import { ProfileService, PublicProfileResponse } from '@/lib/api/profile-new.service'
import { resolveMediaUrl } from '@/lib/media-url'
import { AuthService } from '@/lib/api/auth.service'
import { reportService, UserReportReason, REPORT_REASON_LABELS } from '@/lib/api/report.service'
import { getOccupationLabel } from '@/lib/api/occupations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTriangleExclamation, faClipboardList, faFileLines, faStar,
  faCircleCheck, faGraduationCap, faWrench, faUser, faBriefcase,
  faLocationDot, faEnvelope, faClock, faMoneyBillWave, faCalendarDays,
} from '@fortawesome/free-solid-svg-icons'

// ─── Report modal ─────────────────────────────────────────────────────────────

function ReportModal({
    displayName,
    onClose,
    onSubmit,
}: {
    displayName: string
    onClose: () => void
    onSubmit: (reason: UserReportReason, description: string) => Promise<void>
}) {
    const [reason, setReason] = useState<UserReportReason>(UserReportReason.FRAUD)
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        setError('')
        setSubmitting(true)
        try {
            await onSubmit(reason, description)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Báo cáo tài khoản</h2>
                        <p className="text-sm text-gray-500">Báo cáo <strong>{displayName}</strong></p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>
                    )}
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                        <p className="font-medium mb-1"><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" />Lưu ý trước khi báo cáo</p>
                        <p>Báo cáo sai sự thật có thể ảnh hưởng đến tài khoản của bạn. Chỉ báo cáo khi bạn có bằng chứng xác thực.</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Lý do báo cáo *</label>
                        <div className="space-y-2">
                            {Object.values(UserReportReason).map(r => (
                                <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-red-500" />
                                    <span className="text-sm text-gray-800">{REPORT_REASON_LABELS[r]}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mô tả chi tiết <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="Mô tả hành vi vi phạm, cung cấp bằng chứng nếu có..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">{description.length}/1000</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                        {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Star rating display ───────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    const empty = 5 - full - (half ? 1 : 0)
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-lg leading-none" aria-label={`${rating.toFixed(1)} sao`}>
                {'★'.repeat(full)}
                {half ? '½' : ''}
                <span className="text-slate-200">{'★'.repeat(empty)}</span>
            </span>
            <span className="text-sm font-semibold text-amber-600">{rating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({count} đánh giá)</span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfile() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string

    const [profile, setProfile] = useState<PublicProfileResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Posts (customer only)
    const [userPosts, setUserPosts] = useState<any[]>([])
    const [postsLoading, setPostsLoading] = useState(false)
    const [postsHasMore, setPostsHasMore] = useState(false)
    const [postsCursor, setPostsCursor] = useState<string | undefined>()

    const isProvider = profile?.role === 'provider'
    const defaultTab = isProvider ? 'about' : 'about'
    const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'reviews'>('about')

    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [reportSuccess, setReportSuccess] = useState(false)

    useEffect(() => {
        setIsLoggedIn(Boolean(AuthService.getToken()))
    }, [])

    useEffect(() => {
        if (userId) loadPublicProfile()
    }, [userId])

    // Reset tab when profile role changes
    useEffect(() => {
        setActiveTab('about')
    }, [profile?.role])

    const loadPublicProfile = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await ProfileService.getPublicProfile(userId)
            setProfile(data)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Không thể tải hồ sơ'
            if (msg.includes('Invalid UUID')) setError('❌ Định dạng ID người dùng không hợp lệ')
            else if (msg.includes('notfound') || msg.includes('inactive')) setError('❌ Không tìm thấy người dùng hoặc tài khoản đã ngừng hoạt động')
            else setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const loadUserPosts = async (cursor?: string) => {
        try {
            setPostsLoading(true)
            const qs = new URLSearchParams({ limit: '10' })
            if (cursor) qs.set('cursor', cursor)
            const res = await fetch(`/api/posts/user/${userId}?${qs}`)
            const data = await res.json()
            const incoming = data.data ?? []
            setUserPosts(prev => cursor ? [...prev, ...incoming] : incoming)
            setPostsHasMore(data.hasMore ?? false)
            setPostsCursor(data.nextCursor ?? undefined)
        } catch {
            // silently fail — empty state handles it
        } finally {
            setPostsLoading(false)
        }
    }

    const handleTabChange = (tab: 'about' | 'posts' | 'reviews') => {
        setActiveTab(tab)
        if (tab === 'posts' && userPosts.length === 0) loadUserPosts()
    }

    const handleReport = async (reason: UserReportReason, description: string) => {
        await reportService.reportUser(userId, reason, description || undefined)
        setShowReportModal(false)
        setReportSuccess(true)
        setTimeout(() => setReportSuccess(false), 5000)
    }

    // ── Loading / error states ──────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải hồ sơ...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 shadow-sm max-w-md w-full text-center">
                    <p className="text-red-600 mb-4">{error || 'Không tìm thấy người dùng'}</p>
                    <button onClick={() => router.back()} className="bg-brand text-white px-6 py-2 rounded hover:opacity-90">
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    // ── Derived values ─────────────────────────────────────────────────────────

    const displayName = profile.displayName || 'Người dùng'
    const hasRating = isProvider && typeof profile.reviewCount === 'number' && profile.reviewCount > 0

    // ── Tabs config ─────────────────────────────────────────────────────────────

    const tabs: { key: 'about' | 'posts' | 'reviews'; label: string; icon: typeof faClipboardList }[] = [
        { key: 'about' as const, label: 'Giới thiệu', icon: faClipboardList },
        ...(!isProvider ? [{ key: 'posts' as const, label: 'Bài đăng', icon: faFileLines }] : []),
        ...(isProvider ? [{ key: 'reviews' as const, label: 'Đánh giá', icon: faStar }] : []),
    ]

    return (
        <AppShell>
            <div className="flex min-h-screen flex-col bg-surface-lowest">
                <div className="flex-1">
                    <div className="max-w-4xl mx-auto px-4 py-8">

                        {/* Back */}
                        <button
                            onClick={() => router.back()}
                            className="text-brand hover:opacity-80 mb-4 flex items-center gap-1 text-sm font-medium"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại
                        </button>

                        {/* Report success toast */}
                        {reportSuccess && (
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-green-800 font-medium">Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.</p>
                            </div>
                        )}

                        {/* ── Profile card ──────────────────────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-app-card p-8 mb-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                {/* Avatar */}
                                {resolveMediaUrl(profile.avatarUrl) ? (
                                    <img
                                        src={resolveMediaUrl(profile.avatarUrl)}
                                        alt="Ảnh đại diện"
                                        className="w-28 h-28 rounded-full object-cover border-4 border-brand mb-5 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-4xl font-bold mb-5 shadow-lg">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Name + verified badge (providers only) */}
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{displayName}</h2>
                                    {isProvider && profile.isVerified && (
                                        <span className="flex items-center gap-1 bg-brand/10 text-brand-dark px-3 py-1 rounded-full text-xs font-semibold">
                                            <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Đã xác thực
                                        </span>
                                    )}
                                    {isProvider && profile.hasCertification && (
                                        <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                                            <FontAwesomeIcon icon={faGraduationCap} className="mr-1" />Có chứng chỉ
                                        </span>
                                    )}
                                </div>

                                {/* Role badge */}
                                {profile.role && (
                                    <div className={`px-4 py-1.5 rounded-full font-semibold text-sm mb-3 ${
                                        isProvider ? 'bg-purple-100 text-purple-700' : 'bg-brand/10 text-brand-dark'
                                    }`}>
                                        {isProvider
                                          ? <><FontAwesomeIcon icon={faWrench} className="mr-1" />Thợ / Nhà cung cấp dịch vụ</>
                                          : <><FontAwesomeIcon icon={faUser} className="mr-1" />Khách hàng</>}
                                    </div>
                                )}

                                {/* Occupation (providers) */}
                                {isProvider && profile.mainOccupation && (
                                    <span className="mb-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                        <FontAwesomeIcon icon={faBriefcase} className="mr-1" />{getOccupationLabel(profile.mainOccupation) ?? profile.mainOccupation}
                                    </span>
                                )}

                                {/* Star rating (providers with reviews) */}
                                {hasRating && profile.averageRating != null && (
                                    <div className="mt-1 mb-2">
                                        <StarRating rating={profile.averageRating} count={profile.reviewCount!} />
                                    </div>
                                )}

                                {/* Bio */}
                                {profile.bio && (
                                    <p className="text-gray-600 text-base max-w-2xl mb-3 mt-1">{profile.bio}</p>
                                )}

                                {/* Address */}
                                {profile.address && (
                                    <p className="text-sm text-gray-500 mb-1">
                                        <FontAwesomeIcon icon={faLocationDot} className="mr-1" />{profile.address}
                                    </p>
                                )}

                                {/* Member since */}
                                {profile.memberSince && (
                                    <p className="text-sm text-gray-400">
                                        Thành viên từ {new Date(profile.memberSince).toLocaleDateString('vi-VN', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </p>
                                )}
                            </div>

                            {/* CTA — provider profile: send private request (for all viewers) */}
                            {isProvider && (
                                <div className="mt-4 pt-5 border-t flex flex-col sm:flex-row items-center gap-3">
                                    <button
                                        onClick={() =>
                                            isLoggedIn
                                                ? router.push(`/yeu-cau-rieng/gui/${profile.id}`)
                                                : router.push(`/dang-nhap?redirect=/yeu-cau-rieng/gui/${profile.id}`)
                                        }
                                        className="flex-1 sm:flex-none bg-brand text-white px-6 py-2.5 rounded-xl hover:opacity-90 font-semibold text-sm transition-opacity"
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} className="mr-1" />Gửi yêu cầu riêng
                                    </button>
                                    {/* Report */}
                                    {isLoggedIn && (
                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ml-auto"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                            Báo cáo
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Report button for customer profiles */}
                            {!isProvider && isLoggedIn && (
                                <div className="mt-5 pt-5 border-t flex justify-end">
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                        Báo cáo tài khoản
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Tabs ──────────────────────────────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-app-card mb-5">
                            <div className="flex border-b">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                                            activeTab === tab.key
                                                ? 'text-brand-dark border-b-2 border-brand'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={tab.icon} className="mr-1" />{tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Tab content ───────────────────────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-app-card p-6">

                            {/* About */}
                            {activeTab === 'about' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin hồ sơ</h3>
                                        <div className="space-y-3">
                                            {profile.displayName && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Tên hiển thị:</span>
                                                    <span className="text-gray-800 text-sm">{profile.displayName}</span>
                                                </div>
                                            )}
                                            {profile.role && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Vai trò:</span>
                                                    <span className="text-gray-800 text-sm">
                                                        {isProvider ? 'Thợ / Nhà cung cấp dịch vụ' : 'Khách hàng'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Verified badge — providers only */}
                                            {isProvider && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Xác thực:</span>
                                                    <span className={`text-sm ${profile.isVerified ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                                                        {profile.isVerified
                                                          ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Đã xác thực</>
                                                          : <><FontAwesomeIcon icon={faClock} className="mr-1" />Chưa xác thực</>}
                                                    </span>
                                                </div>
                                            )}
                                            {isProvider && profile.mainOccupation && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Nghề chính:</span>
                                                    <span className="text-gray-800 text-sm">
                                                        {getOccupationLabel(profile.mainOccupation) ?? profile.mainOccupation}
                                                    </span>
                                                </div>
                                            )}
                                            {profile.address && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Địa chỉ:</span>
                                                    <span className="text-gray-800 text-sm"><FontAwesomeIcon icon={faLocationDot} className="mr-1" />{profile.address}</span>
                                                </div>
                                            )}
                                            {profile.memberSince && (
                                                <div className="flex gap-4">
                                                    <span className="font-semibold text-gray-500 min-w-32 text-sm">Tham gia từ:</span>
                                                    <span className="text-gray-800 text-sm">
                                                        {new Date(profile.memberSince).toLocaleDateString('vi-VN', {
                                                            year: 'numeric', month: 'long', day: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {profile.bio && (
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Giới thiệu bản thân</h3>
                                            <p className="text-gray-700 leading-relaxed text-sm">{profile.bio}</p>
                                        </div>
                                    )}

                                    {/* Rating summary inline — providers */}
                                    {isProvider && hasRating && profile.averageRating != null && (
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Đánh giá tổng quan</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="text-5xl font-bold text-amber-500">{profile.averageRating.toFixed(1)}</div>
                                                <div>
                                                    <div className="text-amber-400 text-2xl">{'★'.repeat(Math.round(profile.averageRating))}<span className="text-slate-200">{'★'.repeat(5 - Math.round(profile.averageRating))}</span></div>
                                                    <p className="text-sm text-gray-500 mt-0.5">{profile.reviewCount} đánh giá từ khách hàng</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isProvider && !hasRating && (
                                        <div className="border-t pt-4">
                                            <p className="text-sm text-gray-400">Chưa có đánh giá nào.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Posts — customer only */}
                            {activeTab === 'posts' && !isProvider && (
                                <div className="space-y-4">
                                    {postsLoading && userPosts.length === 0 && (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">Đang tải bài đăng...</p>
                                        </div>
                                    )}
                                    {!postsLoading && userPosts.length === 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400 text-sm">Người dùng này chưa có bài đăng nào.</p>
                                        </div>
                                    )}
                                    {userPosts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => router.push(`/posts/${post.id}`)}
                                            className="border rounded-xl p-4 hover:shadow-md transition cursor-pointer bg-white"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800 mb-2">{post.title}</h4>
                                                    {post.description && (
                                                        <p className="text-gray-500 text-sm mb-3">{post.description.substring(0, 150)}{post.description.length > 150 ? '...' : ''}</p>
                                                    )}
                                                    <div className="flex gap-4 text-sm text-gray-400 flex-wrap">
                                                        {post.location && <span><FontAwesomeIcon icon={faLocationDot} className="mr-1" />{post.location}</span>}
                                                        {post.budget && <span><FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />{Number(post.budget).toLocaleString('vi-VN')} ₫</span>}
                                                        <span><FontAwesomeIcon icon={faCalendarDays} className="mr-1" />{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                    post.status === 'OPEN' ? 'bg-green-100 text-green-700'
                                                    : post.status === 'CLOSED' ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {post.status === 'OPEN' ? 'Đang mở' : post.status === 'CLOSED' ? 'Đã đóng' : post.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {postsHasMore && (
                                        <button
                                            onClick={() => loadUserPosts(postsCursor)}
                                            disabled={postsLoading}
                                            className="w-full rounded-xl border border-outline-variant/60 bg-surface py-2 text-sm font-medium text-foreground hover:border-brand/30 hover:bg-brand-tint/40 disabled:opacity-50 transition-colors"
                                        >
                                            {postsLoading ? 'Đang tải...' : 'Xem thêm'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Reviews — provider only */}
                            {activeTab === 'reviews' && isProvider && (
                                <ProviderReceivedReviewsPanel providerId={userId} compact />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showReportModal && (
                <ReportModal
                    displayName={displayName}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReport}
                />
            )}
        </AppShell>
    )
}
