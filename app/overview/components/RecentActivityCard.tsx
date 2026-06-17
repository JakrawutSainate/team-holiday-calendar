'use client';

import { useTranslation } from '@/src/components/LanguageContext';
import { Activity } from '@/src/libs/calendarData';

interface RecentActivityCardProps {
  activities: Activity[];
}

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-8 bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      <h4 className="font-semibold text-lg text-zinc-900">{t('recentActivity')}</h4>
      <div className="divide-y divide-zinc-100">
        {activities.map((act) => (
          <div key={act.id} className="py-4 flex justify-between items-center text-base">
            <div>
              <p className="font-medium text-zinc-800">{act.title}</p>
              <p className="text-sm text-zinc-500 mt-1">{act.description}</p>
            </div>
            <span className="text-sm text-zinc-400">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
