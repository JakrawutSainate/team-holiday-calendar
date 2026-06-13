'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface AvailabilityChartProps {
  availabilityPercent: number;
  presentCount: number;
}

export default function AvailabilityChart({ availabilityPercent, presentCount }: AvailabilityChartProps) {
  const { t } = useTranslation();
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (availabilityPercent / 100) * circumference;

  return (
    <div className="flex-grow flex flex-col justify-center items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-surface-container-highest"
            cx="64"
            cy="64"
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
          />
          <circle
            className="text-primary transition-all duration-1000 ease-out"
            cx="64"
            cy="64"
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeWidth="8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">{availabilityPercent}%</span>
          <span className="text-[10px] text-secondary">{t('activeText')}</span>
        </div>
      </div>
      <p className="text-sm text-center mt-4 text-on-surface-variant font-medium">
        {presentCount} {t('presentText')}
      </p>
    </div>
  );
}
