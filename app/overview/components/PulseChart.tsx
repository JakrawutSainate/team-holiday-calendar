'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface PulseChartProps {
  burnoutRisk: number[];
}

export default function PulseChart({ burnoutRisk }: PulseChartProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-semibold text-lg text-primary">{t('teamPulse')}</h4>
          <p className="text-xs text-secondary">{t('burnoutRiskIndex')}</p>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <span className="material-symbols-outlined text-sm">trending_down</span>
          <span className="text-xs font-bold">4%</span>
        </div>
      </div>
      {/* Minimal Chart */}
      <div className="h-32 flex items-end justify-between gap-2 px-2">
        {burnoutRisk.map((val, i) => {
          const isToday = i === 6;
          return (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all duration-300 ${
                isToday ? 'bg-primary' : 'bg-surface-container-highest hover:bg-primary'
              }`}
              style={{ height: `${val}%` }}
            ></div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 px-2 text-[10px] text-secondary">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span className="font-bold text-primary">Sun</span>
      </div>
      <div className="mt-6 p-4 bg-surface-container rounded-xl">
        <p className="text-sm font-semibold text-primary">{t('optimalStatus')}</p>
        <p className="text-xs text-secondary mt-1">{t('workloadStable')}</p>
      </div>
    </div>
  );
}
