export default function CalendarSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      {/* Header bar */}
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        {/* Calendar header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="h-9 w-52 bg-zinc-100 rounded-xl" />
          <div className="flex gap-3">
            <div className="h-9 w-9 bg-zinc-100 rounded-xl" />
            <div className="h-9 w-24 bg-zinc-100 rounded-xl" />
            <div className="h-9 w-9 bg-zinc-100 rounded-xl" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-4 flex justify-center">
                <div className="h-4 w-8 bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
          {/* Date cells — 5 rows × 7 cols */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-24 border-b border-r last:border-r-0 border-zinc-100 p-3 space-y-2"
              >
                <div className="h-4 w-6 bg-zinc-100 rounded" />
                {i % 5 === 0 && <div className="h-5 w-full bg-zinc-100 rounded-lg" />}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
