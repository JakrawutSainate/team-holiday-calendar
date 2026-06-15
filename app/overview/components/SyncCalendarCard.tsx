'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface SyncCalendarCardProps {
  onSync: () => void;
}

export default function SyncCalendarCard({ onSync }: SyncCalendarCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <h5 className="text-base font-semibold text-zinc-900 mb-2">{t('sharedCalendarSync')}</h5>
        <p className="text-sm text-zinc-500 leading-relaxed">{t('syncDesc')}</p>
      </div>
      <button
        onClick={onSync}
        className="mt-6 w-full py-3 border border-zinc-900 text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
      >
        {t('enableSync')}
      </button>
    </div>
  );
}
