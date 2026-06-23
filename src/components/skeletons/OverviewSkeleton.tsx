export default function OverviewSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-10 w-64 bg-zinc-100 rounded-xl" />
            <div className="h-4 w-96 bg-zinc-100 rounded" />
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map(i => (
              <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 space-y-4 h-56">
                <div className="h-5 w-40 bg-zinc-100 rounded" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-zinc-100 rounded-full shrink-0" />
                    <div className="h-4 flex-1 bg-zinc-100 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Details row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-zinc-100 rounded-2xl p-6 h-64 space-y-4">
              <div className="h-5 w-36 bg-zinc-100 rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="h-8 w-8 bg-zinc-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-48 bg-zinc-100 rounded" />
                    <div className="h-3 w-full bg-zinc-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 bg-white border border-zinc-100 rounded-2xl p-6 h-64 space-y-4">
              <div className="h-5 w-28 bg-zinc-100 rounded" />
              <div className="flex items-end gap-2 h-36">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-zinc-100 rounded-t" style={{ height: `${40 + i * 12}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
