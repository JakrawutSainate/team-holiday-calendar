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
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl space-y-4 hover:border-primary transition-colors group flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start">
        <img
          alt={member.name}
          className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-outline-variant"
          src={member.avatarUrl}
        />
        <span
          className={`font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-full ${
            isAdmin
              ? 'bg-primary text-on-primary'
              : 'bg-secondary-container text-on-secondary-container'
          }`}
        >
          {member.role === 'LEAD' ? t('teamLead') : member.role === 'ADMIN' ? t('admin') : 'MEMBER'}
        </span>
      </div>
      <div>
        <h4 className="font-bold text-base text-primary">{member.name}</h4>
        <p className="text-xs text-secondary">{member.title}</p>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50">
        <div className="flex flex-col">
          <span className="text-[9px] text-outline font-bold tracking-wider font-label-caps">BALANCE</span>
          <span className="text-xs font-bold text-primary">{member.tokensBalance} {t('tokens')}</span>
        </div>
        <button className="p-1.5 text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-base">event_note</span>
        </button>
      </div>
    </div>
  );
}
