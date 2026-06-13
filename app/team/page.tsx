'use client';

import { useState, useEffect } from 'react';
import TopNavBar from '@/src/components/TopNavBar';
import { getTeamMembers, TeamMember } from '@/src/libs/calendarData';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      const members = await getTeamMembers();
      setTeam(members);
      setLoading(false);
    }
    loadTeam();
  }, []);

  const filteredTeam = team.filter((member) => {
    const term = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(term) ||
      member.title.toLowerCase().includes(term) ||
      member.department.toLowerCase().includes(term)
    );
  });

  const engineeringMembers = filteredTeam.filter(m => m.department === 'Engineering');
  const designMembers = filteredTeam.filter(m => m.department === 'Design');
  const managementMembers = filteredTeam.filter(m => m.department === 'Management');

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64 transition-colors duration-200">
      <TopNavBar placeholder="Search team members..." onSearch={(term) => setSearchTerm(term)} />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Page Header Section */}
          <section className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-4xl font-bold tracking-tight text-primary dark:text-white">Team Directory</h2>
              <p className="text-lg text-secondary dark:text-outline/80">Manage roles and review credit balances across departments.</p>
            </div>
            <button className="border border-outline-variant dark:border-[#2d2f39] bg-surface dark:bg-[#16171d] text-primary dark:text-white px-6 py-3 rounded-lg font-label-caps text-xs font-bold flex items-center gap-2 hover:bg-surface-container dark:hover:bg-[#1c1d24] transition-colors cursor-pointer tracking-wider">
              <span className="material-symbols-outlined">person_add</span>
              <span>ADD MEMBER</span>
            </button>
          </section>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="animate-pulse text-lg font-medium text-secondary dark:text-outline">Loading Directory...</span>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Management Division */}
              {managementMembers.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-outline-variant dark:border-[#2d2f39] pb-2">
                    <h3 className="font-label-caps text-xs text-secondary dark:text-outline tracking-[0.2em] uppercase font-bold">Management</h3>
                    <span className="h-px flex-1 bg-outline-variant/30 dark:bg-[#2d2f39]/30"></span>
                    <span className="text-sm text-outline dark:text-outline/70 font-medium">{managementMembers.length.toString().padStart(2, '0')} Members</span>
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
                  <div className="flex items-center gap-4 border-b border-outline-variant dark:border-[#2d2f39] pb-2">
                    <h3 className="font-label-caps text-xs text-secondary dark:text-outline tracking-[0.2em] uppercase font-bold">Engineering</h3>
                    <span className="h-px flex-1 bg-outline-variant/30 dark:bg-[#2d2f39]/30"></span>
                    <span className="text-sm text-outline dark:text-outline/70 font-medium">{engineeringMembers.length.toString().padStart(2, '0')} Members</span>
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
                  <div className="flex items-center gap-4 border-b border-outline-variant dark:border-[#2d2f39] pb-2">
                    <h3 className="font-label-caps text-xs text-secondary dark:text-outline tracking-[0.2em] uppercase font-bold">Design</h3>
                    <span className="h-px flex-1 bg-outline-variant/30 dark:bg-[#2d2f39]/30"></span>
                    <span className="text-sm text-outline dark:text-outline/70 font-medium">{designMembers.length.toString().padStart(2, '0')} Members</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {designMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </section>
              )}

              {filteredTeam.length === 0 && (
                <div className="py-16 text-center text-secondary dark:text-outline">
                  <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                  <p className="text-sm">No members found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions / Bottom Navigation Alternative */}
          <section className="mt-12 pt-8 border-t border-outline-variant dark:border-[#2d2f39] flex justify-between items-center text-secondary">
            <div className="flex gap-12">
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-outline dark:text-outline/80 font-bold tracking-wider">TOTAL TEAM MEMBERS</span>
                <span className="text-2xl font-bold text-primary dark:text-white">{team.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-outline dark:text-outline/80 font-bold tracking-wider">ACTIVE LEAVE REQUESTS</span>
                <span className="text-2xl font-bold text-primary dark:text-white">05</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 text-primary dark:text-white text-sm font-semibold hover:bg-surface-container dark:hover:bg-[#1c1d24] transition-colors rounded-lg border border-transparent hover:border-outline-variant dark:hover:border-[#2d2f39] cursor-pointer">
                Download Report
              </button>
              <button className="px-4 py-2 text-primary dark:text-white text-sm font-semibold hover:bg-surface-container dark:hover:bg-[#1c1d24] transition-colors rounded-lg border border-transparent hover:border-outline-variant dark:hover:border-[#2d2f39] cursor-pointer">
                Role Settings
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary dark:bg-white text-on-primary dark:text-black rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 cursor-pointer">
        <span className="material-symbols-outlined text-[28px]">person_add</span>
      </button>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const isAdmin = member.role === 'ADMIN' || member.role === 'LEAD';

  return (
    <div className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] p-6 rounded-xl space-y-4 hover:border-primary dark:hover:border-white transition-colors group flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <img
          alt={member.name}
          className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-outline-variant dark:border-[#2d2f39]"
          src={member.avatarUrl}
        />
        <span
          className={`font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-full ${
            isAdmin ? 'bg-primary dark:bg-white text-on-primary dark:text-black' : 'bg-secondary-container dark:bg-[#2d2f39] text-on-secondary-container dark:text-white'
          }`}
        >
          {member.role}
        </span>
      </div>
      <div>
        <h4 className="font-bold text-base text-primary dark:text-white">{member.name}</h4>
        <p className="text-xs text-secondary dark:text-outline">{member.title}</p>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50 dark:border-[#2d2f39]/50">
        <div className="flex flex-col">
          <span className="text-[9px] text-outline font-bold tracking-wider font-label-caps">BALANCE</span>
          <span className="text-xs font-bold text-primary dark:text-white">{member.tokensBalance} Tokens</span>
        </div>
        <button className="p-1.5 text-primary dark:text-white hover:bg-surface-container dark:hover:bg-[#1c1d24] rounded-lg transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-base">event_note</span>
        </button>
      </div>
    </div>
  );
}
