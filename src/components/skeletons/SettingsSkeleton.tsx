export default function SettingsSkeleton() {
  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background animate-pulse">
      <div className="h-16 bg-white border-b border-zinc-100" />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-10 w-36 bg-zinc-100 rounded-xl" />
              <div className="h-4 w-64 bg-zinc-100 rounded" />
            </div>
            <div className="h-8 w-28 bg-zinc-100 rounded-xl" />
          </div>

          {/* Profile Settings Card */}
          <div className="bg-white border border-zinc-100 rounded-2xl p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-36 bg-zinc-100 rounded" />
                <div className="h-3 w-56 bg-zinc-100 rounded" />
              </div>
              <div className="h-8 w-14 bg-zinc-100 rounded-lg" />
            </div>

            <div className="space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-4 p-5 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                <div className="w-16 h-16 bg-zinc-100 rounded-full shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-zinc-100 rounded" />
                  <div className="h-3 w-48 bg-zinc-100 rounded" />
                </div>
              </div>

              {/* Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-zinc-100 rounded" />
                    <div className="h-12 w-full bg-zinc-100 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save button area */}
          <div className="flex justify-end gap-4">
            <div className="h-10 w-28 bg-zinc-100 rounded" />
            <div className="h-12 w-36 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
