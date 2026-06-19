'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface UpcomingHolidaysCardProps {
  items: { title: string; subtitle?: string; type: string }[];
}

export default function UpcomingHolidaysCard({ items }: UpcomingHolidaysCardProps) {
  const { t } = useTranslation();

  // Show only up to 4 items to keep the grid perfectly 2x2 and aligned
  const visibleItems = items.slice(0, 4);

  return (
    <div className="bg-white border border-zinc-100/80 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full min-h-[220px]">
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t('upcomingHolidays')}</h3>
      </div>
      
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <div key={idx} className="flex flex-col justify-center gap-1 p-4 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all duration-200 shadow-sm group">
              <div className="flex items-center gap-2">
                {item.type === 'holiday' && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0 animate-pulse" />}
                {item.type === 'weekend' && <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block shrink-0" />}
                {item.type === 'shift' && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />}
                <span className="text-sm font-bold text-zinc-800 truncate group-hover:text-zinc-950 transition-colors">{item.title}</span>
              </div>
              {item.subtitle && (
                <p className="text-xs text-zinc-500 font-semibold pl-4 mt-1 truncate group-hover:text-zinc-600 transition-colors">{item.subtitle}</p>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center col-span-2 py-6">
            <p className="text-sm text-zinc-400 italic font-medium">No upcoming holidays or shifts</p>
          </div>
        )}
      </div>
    </div>
  );
}
