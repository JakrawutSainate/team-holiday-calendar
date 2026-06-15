'use client';

import { useTranslation } from '@/src/components/LanguageContext';

export default function OverviewHeader() {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <span className="text-base font-medium text-zinc-500">Monday, October 23</span>
      <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{t('goodMorning')}</h2>
      <p className="text-lg text-zinc-600">{t('operatingCapacity')}</p>
    </section>
  );
}
