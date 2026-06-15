'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface TeamHeaderProps {
  onAddMember: () => void;
}

export default function TeamHeader({ onAddMember }: TeamHeaderProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-end">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{t('teamDirectory')}</h2>
        <p className="text-lg text-zinc-500">{t('teamDirectoryDesc')}</p>
      </div>
      <button
        onClick={onAddMember}
        className="border border-zinc-200 bg-white text-zinc-900 px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-zinc-50 transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center"
      >
        <span className="material-symbols-outlined text-base">person_add</span>
        <span>{t('addMember')}</span>
      </button>
    </section>
  );
}
