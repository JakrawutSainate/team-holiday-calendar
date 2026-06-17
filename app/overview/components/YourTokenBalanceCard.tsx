'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface YourTokenBalanceCardProps {
  tokens: number;
}

export default function YourTokenBalanceCard({ tokens }: YourTokenBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
      <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('yourTokenBalance')}</h3>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-6xl font-bold text-zinc-900">{tokens}</span>
          <span className="text-sm font-medium text-zinc-500">{t('tokens')}</span>
        </div>
        <p className="text-sm text-zinc-500">{t('personalTokensRemaining')}</p>
      </div>
    </div>
  );
}
