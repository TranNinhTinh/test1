import { useRouter } from 'next/navigation'

interface AuthorCardProps {
    customerId: string
    displayName?: string | null
    fullName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
    createdAt?: string | Date
    location?: string | null
}

export default function AuthorCard({
    customerId,
    displayName,
    fullName,
    avatarUrl,
    isVerified,
    createdAt,
    location,
}: AuthorCardProps) {
    const router = useRouter()

    const handleProfileClick = () => {
        router.push(`/profile/${customerId}`)
    }

    const authorName = displayName || fullName || 'Anonymous'

    return (
        <div
            onClick={handleProfileClick}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer group"
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 group-hover:border-blue-700 transition"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {authorName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition truncate">
                        {authorName}
                    </p>
                    {isVerified && (
                        <span title="Verified user" className="text-blue-500">
                            ✅
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {createdAt && (
                        <span>{new Date(createdAt).toLocaleDateString('vi-VN')}</span>
                    )}
                    {createdAt && location && <span>•</span>}
                    {location && <span>{location}</span>}
                </div>
            </div>

            {/* Arrow */}
            <div className="text-gray-400 group-hover:text-blue-600 transition">→</div>
        </div>
    )
}
