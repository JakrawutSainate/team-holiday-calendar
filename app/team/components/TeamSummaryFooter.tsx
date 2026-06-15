'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface TeamSummaryFooterProps {
  totalMembers: number;
  onDownloadReport: () => void;
}

export default function TeamSummaryFooter({ totalMembers, onDownloadReport }: TeamSummaryFooterProps) {
  const { t } = useTranslation();

  return (
    <section className="mt-12 pt-8 border-t border-zinc-100 flex flex-col md:flex-row gap-6 md:justify-between md:items-center text-zinc-500">
      <div className="flex gap-12 justify-between md:justify-start">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-500 font-medium">{t('totalTeamMembers')}</span>
          <span className="text-2xl font-bold text-zinc-900">{totalMembers}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-500 font-medium">{t('activeLeaveRequests')}</span>
          <span className="text-2xl font-bold text-zinc-900">05</span>
        </div>
      </div>
      <div className="flex gap-4 w-full md:w-auto">
        <button
          onClick={onDownloadReport}
          className="flex-1 md:flex-none px-5 py-3 text-zinc-900 text-sm font-semibold hover:bg-zinc-50 border border-zinc-200 bg-white rounded-xl transition-all shadow-sm cursor-pointer text-center"
        >
          {t('downloadReport')}
        </button>
        <button className="flex-1 md:flex-none px-5 py-3 text-zinc-900 text-sm font-semibold hover:bg-zinc-50 border border-zinc-200 bg-white rounded-xl transition-all shadow-sm cursor-pointer text-center">
          {t('roleSettings')}
        </button>
      </div>
    </section>
  );
}
