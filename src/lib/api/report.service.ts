import { REAL_API_CONFIG } from './real-api-config'

export enum UserReportReason {
  FRAUD = 'fraud',
  UNRELIABLE = 'unreliable',
  INAPPROPRIATE = 'inappropriate',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  FAKE_ACCOUNT = 'fake_account',
  OTHER = 'other',
}

export const REPORT_REASON_LABELS: Record<UserReportReason, string> = {
  [UserReportReason.FRAUD]: 'Gian lận / Lừa đảo',
  [UserReportReason.UNRELIABLE]: 'Không đáng tin cậy',
  [UserReportReason.INAPPROPRIATE]: 'Hành vi không phù hợp',
  [UserReportReason.SPAM]: 'Spam / Quảng cáo rác',
  [UserReportReason.HARASSMENT]: 'Quấy rối / Bắt nạt',
  [UserReportReason.FAKE_ACCOUNT]: 'Tài khoản giả mạo',
  [UserReportReason.OTHER]: 'Lý do khác',
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export const reportService = {
  async reportUser(
    userId: string,
    reason: UserReportReason,
    description?: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = getToken()
    const url = `${REAL_API_CONFIG.BASE_URL}/users/${userId}/report`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason, description }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.message ?? `HTTP ${res.status}`
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
    }

    return data
  },
}
