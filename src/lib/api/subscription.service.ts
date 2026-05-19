import { AuthService } from './auth.service'

// ─── Enums (mirrors backend) ──────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'annual'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// ─── Domain types (mirrors backend DTOs) ─────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  billingCycle: BillingCycle
  price: number
  features?: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SubscriptionInfo {
  id: string
  userId: string
  planId?: string
  plan?: SubscriptionPlan
  status: SubscriptionStatus
  trialStartDate?: string
  trialEndDate?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  autoRenew: boolean
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface SubscriptionStatusSummary {
  isAccessAllowed: boolean
  status: SubscriptionStatus
  daysUntilExpiry?: number
  trialEndDate?: string
  currentPeriodEnd?: string
  statusMessage: string
}

export interface PaymentCreationResult {
  paymentId: string
  subscriptionId: string
  amount: number
  discountAmount: number
  finalAmount: number
  status: PaymentStatus
  dueDate: string
  stripePaymentIntentId: string
  clientSecret: string
}

export interface SubscriptionPayment {
  id: string
  subscriptionId: string
  userId: string
  planId?: string
  plan?: SubscriptionPlan
  amount: number
  discountId?: string
  discountAmount: number
  finalAmount: number
  status: PaymentStatus
  dueDate?: string
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentListResponse {
  payments: SubscriptionPayment[]
  total: number
  page: number
  limit: number
}

export interface DiscountValidationResult {
  valid: boolean
  discountAmount?: number
  finalAmount?: number
  message?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = AuthService.getAccessToken()
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data as Record<string, unknown>)?.message ||
      (data as Record<string, unknown>)?.error ||
      `Lỗi ${res.status}`
    throw new Error(String(msg))
  }
  return data as T
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SubscriptionService {
  /** Public — no auth required */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const res = await fetch('/api/subscription/plans', {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await handleResponse<SubscriptionPlan[] | { plans?: SubscriptionPlan[] }>(res)
    return Array.isArray(data) ? data : (data.plans ?? [])
  }

  /** Validate a discount code for a given billing cycle */
  static async validateDiscount(
    code: string,
    billingCycle: BillingCycle,
  ): Promise<DiscountValidationResult> {
    const res = await fetch('/api/subscription/discounts/validate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code, billingCycle }),
    })
    return handleResponse<DiscountValidationResult>(res)
  }

  /** Get the caller's current subscription (PROVIDER only) */
  static async getMySubscription(): Promise<SubscriptionInfo> {
    const res = await fetch('/api/subscription/my', { headers: authHeaders() })
    return handleResponse<SubscriptionInfo>(res)
  }

  /** Get a concise status summary (PROVIDER only) */
  static async getMyStatus(): Promise<SubscriptionStatusSummary> {
    const res = await fetch('/api/subscription/my/status', { headers: authHeaders() })
    return handleResponse<SubscriptionStatusSummary>(res)
  }

  /**
   * Subscribe to a plan — creates a Stripe PaymentIntent and returns
   * `clientSecret` for the frontend to confirm via Stripe Elements.
   */
  static async subscribe(
    planId: string,
    discountCode?: string,
  ): Promise<PaymentCreationResult> {
    const res = await fetch('/api/subscription/subscribe', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ planId, ...(discountCode ? { discountCode } : {}) }),
    })
    return handleResponse<PaymentCreationResult>(res)
  }

  /** Cancel the active subscription (PROVIDER only) */
  static async cancelSubscription(reason?: string): Promise<void> {
    const res = await fetch('/api/subscription/cancel', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    })
    await handleResponse<unknown>(res)
  }

  /** Get payment history (PROVIDER only) */
  static async getMyPayments(page = 1, limit = 20): Promise<PaymentListResponse> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
    const res = await fetch(`/api/subscription/my/payments?${qs}`, { headers: authHeaders() })
    return handleResponse<PaymentListResponse>(res)
  }

  /** Cancel the current pending payment + its Stripe PaymentIntent */
  static async cancelPendingPayment(): Promise<void> {
    const res = await fetch('/api/subscription/my/payments/pending', {
      method: 'DELETE',
      headers: authHeaders(),
    })
    await handleResponse<unknown>(res)
  }
}
