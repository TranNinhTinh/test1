import { TOKEN_KEYS } from './config'

// ============ Enums ============

export type CertificationStatus = 'pending' | 'verified' | 'rejected'

// ============ Types ============

export interface CertificationResponse {
    id: string
    userId: string
    title: string
    issuingOrganization?: string
    issueDate?: string
    expiryDate?: string
    fileUrl: string
    originalName?: string
    fileSize?: number
    verificationStatus: CertificationStatus
    rejectionReason?: string
    isExpired: boolean
    createdAt: string
    updatedAt: string
}

export interface PublicCertificationResponse {
    id: string
    title: string
    issuingOrganization?: string
    issueDate?: string
    expiryDate?: string
    fileUrl: string
    isExpired: boolean
    createdAt: string
}

export interface CertificationListResponse {
    data: CertificationResponse[]
    total: number
}

export interface PublicCertificationListResponse {
    data: PublicCertificationResponse[]
    total: number
}

export interface UploadCertificationDto {
    title: string
    issuingOrganization?: string
    issueDate?: string
    expiryDate?: string
}

// ============ Service ============

export class CertificationService {
    private static readonly BASE_URL = '/api/certifications'

    private static getAuthToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
    }

    private static getAuthHeaders(): HeadersInit {
        const token = this.getAuthToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    /** GET /api/certifications/my — list all own certifications (provider only) */
    static async getMyCertifications(): Promise<CertificationListResponse> {
        const response = await fetch(`${this.BASE_URL}/my`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || `HTTP ${response.status}`)
        }
        return response.json()
    }

    /** POST /api/certifications — upload a certification PDF */
    static async uploadCertification(
        dto: UploadCertificationDto,
        file: File,
    ): Promise<CertificationResponse> {
        const token = this.getAuthToken()
        if (!token) throw new Error('Vui lòng đăng nhập trước khi tải lên chứng chỉ')

        if (file.size > 10 * 1024 * 1024) throw new Error('File tối đa 10MB')
        if (file.type !== 'application/pdf') throw new Error('Chỉ chấp nhận file PDF')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', dto.title.trim())
        if (dto.issuingOrganization) formData.append('issuingOrganization', dto.issuingOrganization.trim())
        if (dto.issueDate) formData.append('issueDate', dto.issueDate)
        if (dto.expiryDate) formData.append('expiryDate', dto.expiryDate)

        const response = await fetch(`${this.BASE_URL}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || `HTTP ${response.status}`)
        }
        return response.json()
    }

    /** DELETE /api/certifications/:id */
    static async deleteCertification(certId: string): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.BASE_URL}/${certId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || `HTTP ${response.status}`)
        }
        return response.json()
    }

    /** GET /api/certifications/provider/:providerId — public verified certs */
    static async getProviderCertifications(providerId: string): Promise<PublicCertificationListResponse> {
        const response = await fetch(`${this.BASE_URL}/provider/${providerId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || `HTTP ${response.status}`)
        }
        return response.json()
    }

    /** Human-readable status label */
    static statusLabel(status: CertificationStatus): string {
        switch (status) {
            case 'verified': return 'Đã xác minh'
            case 'rejected': return 'Bị từ chối'
            default: return 'Đang chờ xét duyệt'
        }
    }

    /** Tailwind badge classes per status */
    static statusClasses(status: CertificationStatus): string {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800'
            case 'rejected': return 'bg-red-100 text-red-800'
            default: return 'bg-yellow-100 text-yellow-800'
        }
    }
}
