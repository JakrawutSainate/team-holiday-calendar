'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface YourTokenBalanceCardProps {
  tokens: number;
  onQuickRequest: () => void;
}

export default function YourTokenBalanceCard({ tokens, onQuickRequest }: YourTokenBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('yourTokenBalance')}</h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-6xl font-bold text-zinc-900">{tokens}</span>
          <span className="text-sm font-medium text-zinc-500">{t('tokens')}</span>
        </div>
        <p className="text-sm text-zinc-500">{t('personalTokensRemaining')}</p>
      </div>
      <button
        onClick={onQuickRequest}
        className="mt-6 border border-zinc-200 bg-white hover:bg-zinc-50 px-5 py-3 rounded-xl text-base font-medium text-zinc-900 cursor-pointer w-full transition-all"
      >
        {t('redeemCarryOver')}
      </button>
    </div>
  );
}
