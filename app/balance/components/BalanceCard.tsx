'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface BalanceCardProps {
  tokens: number;
  onRedeem: () => void;
}

export default function BalanceCard({ tokens, onRedeem }: BalanceCardProps) {
  const { t } = useTranslation();

  return (
    <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-100/80 rounded-2xl p-8 flex flex-col justify-between min-h-[300px] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div>
        <span className="px-3.5 py-1.5 bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-full text-sm font-semibold">
          {t('activeBalance')}
        </span>
        <div className="mt-6 flex items-baseline gap-1.5">
          <span className="text-8xl font-bold leading-none tracking-tighter text-zinc-900">{tokens}</span>
          <span className="text-lg font-semibold text-zinc-500">{t('tokens')}</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-zinc-100/80">
        <p className="text-base text-zinc-500">{t('readyForUse')}</p>
        <button onClick={onRedeem} className="px-7 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-98 transition-all cursor-pointer shadow-sm">
          {t('requestLeave')}
        </button>
      </div>
    </div>
  );
}
