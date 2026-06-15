'use client';

import { useTranslation } from '@/src/components/LanguageContext';

export default function HowItWorksCard() {
  const { t } = useTranslation();

  return (
    <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-100/80 rounded-2xl p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-zinc-900">{t('howItWorks')}</h3>
        <div className="space-y-3 text-base text-zinc-600">
          <p className="leading-relaxed"><strong>01</strong> {t('earnDaily')}: {t('earnDailyDesc')}</p>
          <p className="leading-relaxed"><strong>02</strong> {t('redeemLeave')}: {t('redeemLeaveDesc')}</p>
        </div>
      </div>
      <div className="mt-6 p-4 bg-zinc-50/50 rounded-xl text-sm border border-zinc-100/60 text-zinc-500">
        <p className="italic">"{t('balanceResets')}"</p>
      </div>
    </div>
  );
}
