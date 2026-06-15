'use client';

import { useTranslation } from '@/src/components/LanguageContext';

export default function BalanceHeader() {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <p className="text-sm text-zinc-500 font-medium">
        {t('accountOverview')}
      </p>
      <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
        {t('tokenBalance')}
      </h2>
    </section>
  );
}
