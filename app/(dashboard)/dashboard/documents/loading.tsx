export default function DocumentsLoading() {
  return (
    <div className="p-6 sm:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-9 w-56 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />
          <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-12 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-12 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Documents Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>

            <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />

            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-4" />

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
