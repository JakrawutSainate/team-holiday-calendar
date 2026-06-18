'use client';

import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';

export default function OverviewHeader() {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greeting = user
    ? (language === 'th' ? `สวัสดี คุณ ${user.name}` : `Good morning, ${user.name}`)
    : t('goodMorning');

  return (
    <section className="space-y-2">
      <span className="text-base font-medium text-zinc-500">{dateStr}</span>
      <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{greeting}</h2>
      <p className="text-lg text-zinc-600">{t('operatingCapacity')}</p>
    </section>
  );
}

