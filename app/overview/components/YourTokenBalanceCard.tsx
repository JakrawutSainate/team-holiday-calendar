'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface YourTokenBalanceCardProps {
  tokens: number;
  unclaimedCount?: number;
  onOpenClaimModal?: () => void;
}

export default function YourTokenBalanceCard({
  tokens,
  unclaimedCount = 0,
  onOpenClaimModal,
}: YourTokenBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-white border border-zinc-100/80 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full min-h-[220px] group hover:border-zinc-200 transition-all duration-200">
      {/* Background glowing shape */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="z-10 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{t('yourTokenBalance')}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-4 z-10">
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

      {/* Unclaimed Special Workdays Banner */}
      {unclaimedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-100 z-10 flex items-center justify-between bg-amber-500/10 -mx-8 -mb-8 p-4 px-8 border-b-0 rounded-b-3xl">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold text-amber-900">
              {t('unclaimedShiftsCount').replace('{count}', unclaimedCount.toString())}
            </span>
          </div>
          <button
            onClick={onOpenClaimModal}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">military_tech</span>
            <span>{t('claimNow')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
