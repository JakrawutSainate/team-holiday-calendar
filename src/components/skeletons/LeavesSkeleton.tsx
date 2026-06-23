export default function LeavesSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-10 w-64 bg-zinc-100 rounded-xl" />
              <div className="h-4 w-80 bg-zinc-100 rounded" />
            </div>
            <div className="h-16 w-44 bg-zinc-100 rounded-2xl" />
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 p-4 pl-6 border-b border-zinc-100 bg-zinc-50/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-zinc-200 rounded" />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 pl-6 border-b last:border-b-0 border-zinc-100 items-center">
                <div className="h-5 w-32 bg-zinc-100 rounded" />
                <div className="h-6 w-24 bg-zinc-100 rounded-lg" />
                <div className="h-4 w-40 bg-zinc-100 rounded" />
                <div className="h-6 w-20 bg-zinc-100 rounded-lg" />
                <div className="h-8 w-28 bg-zinc-100 rounded-xl ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
