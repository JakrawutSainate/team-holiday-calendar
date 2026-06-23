export default function BalanceSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-10 w-48 bg-zinc-100 rounded-xl" />
            <div className="h-4 w-72 bg-zinc-100 rounded" />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-100 rounded-2xl p-6 space-y-6 h-52">
              <div className="h-5 w-32 bg-zinc-100 rounded" />
              <div className="h-14 w-28 bg-zinc-100 rounded-xl" />
              <div className="h-10 w-full bg-zinc-100 rounded-xl" />
            </div>
            <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-100 rounded-2xl p-6 space-y-4 h-52">
              <div className="h-5 w-36 bg-zinc-100 rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-8 w-8 bg-zinc-100 rounded-full shrink-0" />
                  <div className="flex-1 h-4 bg-zinc-100 rounded" />
                  <div className="h-4 w-16 bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Transaction table */}
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden space-y-0">
            <div className="p-4 pl-6 border-b border-zinc-100">
              <div className="h-5 w-44 bg-zinc-100 rounded" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-4 pl-6 border-b last:border-b-0 border-zinc-100 items-center">
                <div className="h-4 w-24 bg-zinc-100 rounded" />
                <div className="h-4 w-32 bg-zinc-100 rounded" />
                <div className="h-6 w-16 bg-zinc-100 rounded-lg" />
                <div className="h-4 w-12 bg-zinc-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
