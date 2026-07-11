import React from 'react';

export function SkeletonHeader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-zinc-200 rounded-xl w-1/3"></div>
      <div className="h-4 bg-zinc-150 rounded-lg w-2/3"></div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-zinc-100 rounded-2xl p-6 h-48 space-y-4">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-zinc-200 rounded-full"></div>
            <div className="w-12 h-6 bg-zinc-200 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-zinc-200 rounded-lg w-1/2"></div>
            <div className="h-3 bg-zinc-150 rounded-lg w-3/4"></div>
          </div>
          <div className="border-t border-zinc-50 pt-4 flex justify-between">
            <div className="h-3 bg-zinc-100 rounded-lg w-1/3"></div>
            <div className="w-4 h-4 bg-zinc-250 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 space-y-4 animate-pulse">
      <div className="h-10 bg-zinc-50 rounded-xl w-full"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 p-2">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-8 bg-zinc-100 rounded-lg flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
