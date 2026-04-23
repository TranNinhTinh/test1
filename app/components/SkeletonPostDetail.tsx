export default function SkeletonPostDetail() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4 animate-pulse">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-10 h-10 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="animate-pulse space-y-6">
                {/* Badge */}
                <div className="h-6 bg-gray-200 rounded-full w-32"></div>
                
                {/* Title */}
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-4/5"></div>
                </div>

                {/* Service Tag */}
                <div className="h-6 bg-gray-200 rounded w-40"></div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>

                {/* Price & Location Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-gray-100 rounded-lg"></div>
                  <div className="h-24 bg-gray-100 rounded-lg"></div>
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                </div>
              </div>
            </div>

            {/* Comments Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-24 bg-gray-100 rounded-lg"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-50 rounded-lg"></div>
                  <div className="h-20 bg-gray-50 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="animate-pulse space-y-6">
                {/* Posted By */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
