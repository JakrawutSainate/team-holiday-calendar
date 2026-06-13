'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import MemberCard from './MemberCard';
import { TeamMember } from '@/src/libs/calendarData';
import { HolidayHQManager } from '@/src/libs/models/HolidayHQManager';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { inviteMemberAction, downloadTeamReportAction } from '../actions';

export default function TeamView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchTerm = searchParams.get('q') || '';
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const manager = new HolidayHQManager();
    setMembers(manager.getTeamMembers(searchTerm));
    setLoading(false);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAddMember = async () => {
    const mockInput = {
      name: 'John Doe',
      email: 'john.doe@holidayhq.com',
      role: 'MEMBER' as const,
      department: 'Engineering' as const,
      title: 'Software Engineer'
    };
    const res = await inviteMemberAction(mockInput);
    if (res.success) {
      alert(`Invited ${mockInput.name} successfully!`);
    } else {
      alert(`Invitation failed: ${res.error}`);
    }
  };

  const handleDownloadReport = async () => {
    const res = await downloadTeamReportAction();
    if (res.success) {
      alert(`PDF report generated! File path: ${res.downloadUrl}`);
    }
  };

  const engineeringMembers = members.filter(m => m.department === 'Engineering');
  const designMembers = members.filter(m => m.department === 'Design');
  const managementMembers = members.filter(m => m.department === 'Management');

  return (
    <div className="grow flex flex-col min-h-screen ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTeamMembers')} onSearch={handleSearch} />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Page Header Section */}
          <section className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{t('teamDirectory')}</h2>
              <p className="text-lg text-zinc-500">{t('teamDirectoryDesc')}</p>
            </div>
            <button onClick={handleAddMember} className="border border-zinc-200 bg-white text-zinc-900 px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-zinc-50 transition-all cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>{t('addMember')}</span>
            </button>
          </section>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="animate-pulse text-lg font-medium text-zinc-500">Loading Directory...</span>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Management Division */}
              {managementMembers.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-semibold text-zinc-900">{t('management')}</h3>
                    <span className="h-px flex-1 bg-zinc-100"></span>
                    <span className="text-sm text-zinc-400 font-medium">{managementMembers.length.toString().padStart(2, '0')} {t('membersCount')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {managementMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </section>
              )}

              {/* Engineering Division */}
              {engineeringMembers.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-semibold text-zinc-900">{t('engineering')}</h3>
                    <span className="h-px flex-1 bg-zinc-100"></span>
                    <span className="text-base text-zinc-400 font-medium">{engineeringMembers.length.toString().padStart(2, '0')} {t('membersCount')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {engineeringMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </section>
              )}

              {/* Design Division */}
              {designMembers.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-semibold text-zinc-900">{t('design')}</h3>
                    <span className="h-px flex-1 bg-zinc-100"></span>
                    <span className="text-base text-zinc-400 font-medium">{designMembers.length.toString().padStart(2, '0')} {t('membersCount')}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {designMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </section>
              )}

              {members.length === 0 && (
                <div className="py-16 text-center text-zinc-500 bg-white border border-zinc-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">search_off</span>
                  <p className="text-base">No members found matching your search</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions / Bottom Navigation Alternative */}
          <section className="mt-12 pt-8 border-t border-zinc-100 flex justify-between items-center text-zinc-500">
            <div className="flex gap-12">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-zinc-500 font-medium">{t('totalTeamMembers')}</span>
                <span className="text-2xl font-bold text-zinc-900">{members.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-zinc-500 font-medium">{t('activeLeaveRequests')}</span>
                <span className="text-2xl font-bold text-zinc-900">05</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleDownloadReport} className="px-5 py-3 text-zinc-900 text-sm font-semibold hover:bg-zinc-50 border border-zinc-200 bg-white rounded-xl transition-all shadow-sm cursor-pointer">
                {t('downloadReport')}
              </button>
              <button className="px-5 py-3 text-zinc-900 text-sm font-semibold hover:bg-zinc-50 border border-zinc-200 bg-white rounded-xl transition-all shadow-sm cursor-pointer">
                {t('roleSettings')}
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <button onClick={handleAddMember} className="fixed bottom-8 right-8 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 cursor-pointer">
        <span className="material-symbols-outlined text-[28px]">person_add</span>
      </button>
    </div>
  );
}
