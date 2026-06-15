'use client';

import { useTranslation } from '@/src/components/LanguageContext';

export default function UpcomingHolidaysCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 mb-6">{t('upcomingHolidays')}</h3>
        <div className="space-y-4">
          <p className="text-base font-medium text-zinc-800">
            Emma Wilson <span className="text-sm font-normal text-zinc-500">(Tomorrow)</span>
          </p>
          <p className="text-base font-medium text-zinc-800">
            James Chen <span className="text-sm font-normal text-zinc-500">(Oct 26)</span>
          </p>
          <p className="text-base font-medium text-zinc-800">
            Sara Miller <span className="text-sm font-normal text-zinc-500">(Nov 02)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
