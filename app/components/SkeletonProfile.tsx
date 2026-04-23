export default function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6 animate-pulse">
            {/* Avatar Skeleton */}
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            
            {/* Info Skeleton */}
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-t w-1/2 mr-1"></div>
            <div className="h-12 bg-gray-100 rounded-t w-1/2 ml-1"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-6 animate-pulse">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded w-full"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
