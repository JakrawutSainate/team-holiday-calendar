'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface PulseChartProps {
  burnoutRisk: number[];
}

export default function PulseChart({ burnoutRisk }: PulseChartProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg text-zinc-900">{t('teamPulse')}</h4>
          <p className="text-sm text-zinc-500 mt-1">{t('burnoutRiskIndex')}</p>
        </div>
        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-sm font-semibold">
          <span className="material-symbols-outlined text-sm">trending_down</span>
          <span>4%</span>
        </div>
      </div>
      {/* Minimal Chart */}
      <div className="h-32 flex items-end justify-between gap-3 px-2">
        {burnoutRisk.map((val, i) => {
          const isToday = i === 6;
          return (
            <div
              key={i}
              className={`w-full rounded-t-md transition-all duration-300 ${
                isToday ? 'bg-zinc-900' : 'bg-zinc-100 hover:bg-zinc-900'
              }`}
              style={{ height: `${val}%` }}
            ></div>
          );
        })}
      </div>
      <div className="flex justify-between px-2 text-sm text-zinc-500">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span className="font-semibold text-zinc-950">Sun</span>
      </div>
      <div className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-xl space-y-2">
        <p className="text-base font-semibold text-zinc-900">{t('optimalStatus')}</p>
        <p className="text-sm text-zinc-600 leading-relaxed">{t('workloadStable')}</p>
      </div>
    </div>
  );
}
