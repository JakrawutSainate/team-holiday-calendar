'use client';

import { TeamMember } from '@/src/libs/calendarData';
import { useTranslation } from '@/src/components/LanguageContext';

interface MemberCardProps {
  member: TeamMember;
}

export default function MemberCard({ member }: MemberCardProps) {
  const { t } = useTranslation();
  const isAdmin = member.role === 'ADMIN' || member.role === 'LEAD';

  return (
    <div className="bg-white border border-zinc-100/80 p-6 rounded-xl space-y-4 hover:border-zinc-900 transition-colors group flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-start">
        {member.avatarUrl ? (
          <img
            alt={member.name}
            className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-zinc-100"
            src={member.avatarUrl}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
            <span className="material-symbols-outlined text-zinc-400">person</span>
          </div>
        )}
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isAdmin
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-800'
          }`}
        >
          {member.role === 'LEAD' ? t('teamLead') : member.role === 'ADMIN' ? t('admin') : 'Member'}
        </span>
      </div>
      <div>
        <h4 className="font-bold text-base text-zinc-900">{member.name}</h4>
        <p className="text-sm text-zinc-500 mt-0.5">{member.title}</p>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400 font-medium">Balance</span>
          <span className="text-sm font-bold text-zinc-900 mt-0.5">{member.tokensBalance} {t('tokens')}</span>
        </div>
        <button className="p-2 text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-base">event_note</span>
        </button>
      </div>
    </div>
  );
}
