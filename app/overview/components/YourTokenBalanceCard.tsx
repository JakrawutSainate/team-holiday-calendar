'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface YourTokenBalanceCardProps {
  tokens: number;
}

export default function YourTokenBalanceCard({ tokens }: YourTokenBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-white border border-zinc-100/80 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full min-h-[220px] group hover:border-zinc-200 transition-all duration-200">
      {/* Background glowing shape */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="z-10">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t('yourTokenBalance')}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-6 z-10">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-extrabold text-zinc-900 tracking-tight drop-shadow-sm">{tokens}</span>
            <span className="text-base font-bold text-amber-500 uppercase tracking-wider">{t('tokens')}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-semibold">{t('personalTokensRemaining')}</p>
        </div>
        
        {/* Token graphical badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
          <span className="material-symbols-outlined text-3xl text-amber-500 font-medium select-none">toll</span>
        </div>
      </div>
    </div>
  );
}
