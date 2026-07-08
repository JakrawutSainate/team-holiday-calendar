'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import MemberCard from './MemberCard';
import { TeamMember, getTeamMembers } from '@/src/libs/calendarData';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { inviteMemberAction, downloadTeamReportAction } from '../actions';
import { TeamController } from './TeamController';
import TeamSkeleton from '@/src/components/skeletons/TeamSkeleton';

// Components
import TeamHeader from './TeamHeader';
import TeamSummaryFooter from './TeamSummaryFooter';

import { useAuth } from '@/src/components/AuthContext';
import { adminAddTokensMutation } from '@/src/libs/calendarData';
import dynamic from 'next/dynamic';

const AddTokenDialog = dynamic(() => import('@/src/components/AddTokenDialog').then((mod) => mod.AddTokenDialog), { ssr: false });

interface TeamClientProps {
  initialMembers: TeamMember[];
  searchTerm: string;
}

export default function TeamClient({ initialMembers, searchTerm }: TeamClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [, setTick] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const hasMounted = useRef(false);

  const [selectedTargetMember, setSelectedTargetMember] = useState<TeamMember | null>(null);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  const [controller] = useState<TeamController>(() => new TeamController(
    initialMembers,
    searchTerm,
    () => setTick((tick) => tick + 1)
  ));

  const handleConfirmAddTokens = async (amount: number, description: string) => {
    if (!selectedTargetMember) return;
    try {
      await adminAddTokensMutation(selectedTargetMember.id, amount, description);
      // Reload members list
      const members = await getTeamMembers();
      const term = searchTerm.toLowerCase();
      const filtered = members.filter(
        m => m.name.toLowerCase().includes(term) ||
             m.title.toLowerCase().includes(term) ||
             m.department.toLowerCase().includes(term)
      );
      controller.setMembers(filtered);
    } catch (e: any) {
      alert(e.message || 'Failed to add tokens');
    }
  };

  // React to searchTerm parameter changing
  useEffect(() => {
    const firstMount = !hasMounted.current;
    hasMounted.current = true;

    if (!firstMount) setIsSearching(true);

    getTeamMembers().then(members => {
      const term = searchTerm.toLowerCase();
      const filtered = members.filter(
        m => m.name.toLowerCase().includes(term) ||
             m.title.toLowerCase().includes(term) ||
             m.department.toLowerCase().includes(term)
      );
      controller.setMembers(filtered);
    }).finally(() => setIsSearching(false));
  }, [searchTerm, controller]);

  if (isSearching) return <TeamSkeleton />;

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
    try {
      const msg = await controller.inviteMember(inviteMemberAction);
      alert(msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const msg = await controller.downloadReport(downloadTeamReportAction);
      alert(msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const members = controller.getMembers();
  const engineeringMembers = members.filter((m) => m.department === 'Engineering');
  const designMembers = members.filter((m) => m.department === 'Design');
  const managementMembers = members.filter((m) => m.department === 'Management');

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchTeamMembers')} onSearch={handleSearch} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Page Header Section */}
          <TeamHeader onAddMember={handleAddMember} />

          <div className="space-y-12">
            {/* Management Division */}
            {managementMembers.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                  <h3 className="text-base font-semibold text-zinc-900">{t('management')}</h3>
                  <span className="h-px flex-1 bg-zinc-100"></span>
                  <span className="text-sm text-zinc-400 font-medium">
                    {managementMembers.length.toString().padStart(2, '0')} {t('membersCount')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {managementMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      showAdminActions={user?.role === 'ADMIN'}
                      onAddTokens={() => {
                        setSelectedTargetMember(member);
                        setShowAddTokenModal(true);
                      }}
                    />
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
                  <span className="text-base text-zinc-400 font-medium">
                    {engineeringMembers.length.toString().padStart(2, '0')} {t('membersCount')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {engineeringMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      showAdminActions={user?.role === 'ADMIN'}
                      onAddTokens={() => {
                        setSelectedTargetMember(member);
                        setShowAddTokenModal(true);
                      }}
                    />
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
                  <span className="text-base text-zinc-400 font-medium">
                    {designMembers.length.toString().padStart(2, '0')} {t('membersCount')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {designMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      showAdminActions={user?.role === 'ADMIN'}
                      onAddTokens={() => {
                        setSelectedTargetMember(member);
                        setShowAddTokenModal(true);
                      }}
                    />
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

          {/* Quick Actions / Bottom Navigation Alternative */}
          <TeamSummaryFooter totalMembers={members.length} onDownloadReport={handleDownloadReport} />
        </div>
      </main>

      {/* Floating Action Button */}
      {user && (
        <button
          onClick={handleAddMember}
          className="fixed bottom-8 right-8 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px]">person_add</span>
        </button>
      )}

      <AddTokenDialog
        open={showAddTokenModal}
        onClose={() => {
          setShowAddTokenModal(false);
          setSelectedTargetMember(null);
        }}
        memberName={selectedTargetMember?.name || ''}
        onConfirm={handleConfirmAddTokens}
      />
    </div>
  );
}
