export default function AnalyticsLoading() {
  return (
    <div className="p-6 sm:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>

      {/* Key Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />
            <div className="h-[300px] bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />
          <div className="h-[250px] bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
        </div>
      </div>

      {/* Activity Heatmap Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />
        <div className="h-[200px] bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
      </div>
    </div>
  );
}
