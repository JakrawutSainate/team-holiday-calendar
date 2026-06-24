export default function TeamSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-10 w-40 bg-zinc-100 rounded-xl" />
              <div className="h-4 w-64 bg-zinc-100 rounded" />
            </div>
            <div className="h-10 w-32 bg-zinc-100 rounded-xl" />
          </div>

          {/* Department sections */}
          {[0, 1, 2].map((section) => (
            <div key={section} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                <div className="h-4 w-28 bg-zinc-200 rounded" />
                <span className="h-px flex-1 bg-zinc-100" />
                <div className="h-4 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-zinc-100 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-zinc-100 rounded-xl shrink-0" />
                      <div className="h-5 w-16 bg-zinc-100 rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-zinc-100 rounded" />
                      <div className="h-3 w-20 bg-zinc-100 rounded" />
                    </div>
                    <div className="h-px bg-zinc-100" />
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-3 w-12 bg-zinc-100 rounded" />
                        <div className="h-4 w-16 bg-zinc-100 rounded" />
                      </div>
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
