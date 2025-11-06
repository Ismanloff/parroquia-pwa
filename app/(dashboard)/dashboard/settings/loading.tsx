export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />
        <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-t-lg" />
        ))}
      </div>

      {/* Settings Sections Skeleton */}
      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>

            <div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>

            <div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />

          <div className="space-y-4">
            <div>
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>

            <div>
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
