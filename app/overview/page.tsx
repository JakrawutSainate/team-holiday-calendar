'use client';

import { useState, useEffect } from 'react';
import TopNavBar from '@/src/components/TopNavBar';
import { getTeamMembers, TeamMember } from '@/src/libs/calendarData';

export default function OverviewPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      const members = await getTeamMembers();
      setTeam(members);
      setLoading(false);
    }
    loadTeam();
  }, []);

  const totalMembers = team.length;
  const presentCount = Math.max(totalMembers - 1, 0);
  const availabilityPercent = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 100;
  
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (availabilityPercent / 100) * circumference;

  const upcomingHolidays = [
    {
      name: 'Emma Wilson',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLvx7Xf_YkyTrmoA5VsqpWARTy6x2B57m9iYz0XL79_13B3WnSWID_7YDFiyKEvJOr1pZ6BKuk5ZCHiS4F6VMSWFY2BVv-vKtnQQ1J4Rr3cu7YybMoSbp2k2eq528ongHShfl7WnBVS8bw6rnj5_Ncd66dhSYlUTdkVIf8lYCP4EyUm0aYf1guyduilRRWLd82zDVUFz31uWIgK6sKJM4T_9bYVxzzlI5UbbdQeBYQjXCcaQQfh3c4xOMNJ0aA9dNZXOedoxRY6NN',
      detail: 'Starts Tomorrow (3 days)',
    },
    {
      name: 'James Chen',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABB4ZGYbSS5z7ulvcLB7pUg6tVioZdltjj0zCjaJxJ0PuLblq42PkESldH1RIW3uw8mzZd5J8a-TPI9y_DXVT4N800Cv8Ty7yLUjoS0NmGfLJkn1lZ6_DvUzVvgwX9rSPC5usidysPsfj_nDWKie923IYlpy1x4JtahV-6kFI7AhdKg162pvxYuPsFb0So9_MX6YUI55FjZKW_KaKKTh0l-DA1Fkh114IT4b69yneExap_z51YprQLsDouekWATDESEkzLTEZ-ervB',
      detail: 'Oct 26 (5 days)',
    },
    {
      name: 'Sara Miller',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1hfusiRKlBAGR2yoX8bOMv0rMBUwY5HR0_qlnlK4nks-ZfZCj98kO1VJ2WBf3SOs1pH_sAghPPhZuc_meKu0AIVQspRmEZvpQM8_IJ5XXVVE0dHWccHLEvBHYX0wCsc7ouNxh_ASumlPFIWr_KKRYzsuh5ZwIZPDeHYacv8F9fLpbA0nmEYdibKck3YFKxawpxZ-kDgO4V7IeVTtG9z1JM-MVDgZmj6EwlKrE808Be6F1-AmXwsPETOvaRq9GMwd4tLN1zXNzms9V',
      detail: 'Nov 02 (1 day)',
    }
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64 transition-colors duration-200">
      <TopNavBar placeholder="Search team or records..." />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto">
          {/* Welcome Header */}
          <section className="mb-12">
            <span className="font-label-caps text-xs text-on-secondary-container dark:text-outline mb-2 block uppercase font-bold tracking-wider">
              Monday, Oct 23
            </span>
            <h2 className="text-4xl font-bold tracking-tight text-primary dark:text-white">
              Good morning, Takahashi S.
            </h2>
            <p className="text-lg text-secondary dark:text-outline/80 max-w-2xl mt-4">
              Your team is operating at high capacity today. Three requests are pending your review before the weekend cutoff.
            </p>
          </section>

          {/* KPI Grid (Bento Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Upcoming Holidays */}
            <div className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-6 flex flex-col justify-between group hover:border-primary dark:hover:border-white transition-colors duration-300">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-xs text-secondary dark:text-outline/80 font-semibold uppercase tracking-widest">Upcoming Holidays</span>
                <span className="material-symbols-outlined text-secondary dark:text-outline group-hover:text-primary dark:group-hover:text-white transition-colors">
                  flight_takeoff
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {upcomingHolidays.map((holiday, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      alt={`${holiday.name} avatar`}
                      className="w-8 h-8 rounded-full border border-outline-variant dark:border-[#2d2f39] object-cover"
                      src={holiday.avatar}
                    />
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-on-surface dark:text-white">{holiday.name}</p>
                      <p className="text-[10px] text-secondary dark:text-outline/70">{holiday.detail}</p>
                    </div>
                    <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Availability */}
            <div className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-6 flex flex-col group hover:border-primary dark:hover:border-white transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className="font-label-caps text-xs text-secondary dark:text-outline/80 font-semibold uppercase tracking-widest">Team Availability</span>
                <span className="material-symbols-outlined text-secondary dark:text-outline group-hover:text-primary dark:group-hover:text-white transition-colors">
                  bolt
                </span>
              </div>
              <div className="flex-grow flex flex-col justify-center items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      className="text-surface-container-highest dark:text-[#2d2f39]"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-primary dark:text-white transition-all duration-1000 ease-out"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r={radius}
                      stroke="currentColor"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-primary dark:text-white">{availabilityPercent}%</span>
                    <span className="text-[10px] text-secondary dark:text-outline/70">Active</span>
                  </div>
                </div>
                <p className="text-sm text-center mt-4 text-on-surface-variant dark:text-outline/80">
                  {loading ? 'Calculating...' : `${presentCount} of ${totalMembers} members present today`}
                </p>
              </div>
            </div>

            {/* Your Token Balance */}
            <div className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] text-on-surface dark:text-white rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary dark:hover:border-white transition-colors duration-300">
              <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-[120px] text-primary dark:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  wallet
                </span>
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="font-label-caps text-xs text-secondary dark:text-outline font-semibold uppercase tracking-widest">Your Token Balance</span>
                <span className="material-symbols-outlined text-secondary dark:text-outline">stars</span>
              </div>
              <div className="relative z-10 mt-8">
                <h3 className="text-6xl font-bold leading-none tracking-tighter text-primary dark:text-white">3</h3>
                <p className="text-sm text-secondary dark:text-outline/80 mt-2">Personal Leave Tokens Remaining</p>
              </div>
              <button className="relative z-10 mt-6 border border-outline-variant dark:border-[#2d2f39] bg-surface dark:bg-white/5 hover:bg-surface-container dark:hover:bg-white/10 active:scale-95 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-center cursor-pointer text-primary dark:text-white">
                Redeem for Carry Over
              </button>
            </div>
          </div>

          {/* Detailed Stats & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Activity List (8 cols) */}
            <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-outline-variant dark:border-[#2d2f39] flex justify-between items-center">
                <h4 className="font-semibold text-lg text-primary dark:text-white">Recent Activity</h4>
                <button className="font-label-caps text-xs text-secondary dark:text-outline hover:text-primary dark:hover:text-white transition-colors cursor-pointer font-bold tracking-wider">
                  View Ledger
                </button>
              </div>
              <div className="divide-y divide-outline-variant/50 dark:divide-[#2d2f39]/50">
                {/* Activity Item 1 */}
                <div className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low/30 dark:hover:bg-[#1c1d24]/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-[#2d2f39] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary dark:text-outline">check_circle</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-on-surface dark:text-white">Holiday Approved: <span className="font-bold text-primary dark:text-white">Marco Rossi</span></p>
                    <p className="text-xs text-secondary dark:text-outline/70">Christmas Break · Dec 20 - Jan 02</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-secondary dark:text-outline/65 font-medium">2 hours ago</p>
                    <p className="text-[10px] text-on-primary-container bg-primary-fixed dark:bg-[#2d2f39] dark:text-white px-2 py-0.5 rounded-full inline-block mt-1">
                      Manager: Takahashi S.
                    </p>
                  </div>
                </div>
                {/* Activity Item 2 */}
                <div className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low/30 dark:hover:bg-[#1c1d24]/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-[#2d2f39] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary dark:text-outline">add_circle</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-on-surface dark:text-white">New Request: <span className="font-bold text-primary dark:text-white">Lina Park</span></p>
                    <p className="text-xs text-secondary dark:text-outline/70">Sick Leave · Today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-secondary dark:text-outline/65 font-medium">5 hours ago</p>
                    <p className="text-[10px] text-error bg-error-container px-2 py-0.5 rounded-full inline-block mt-1">
                      Priority: High
                    </p>
                  </div>
                </div>
                {/* Activity Item 3 */}
                <div className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low/30 dark:hover:bg-[#1c1d24]/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-[#2d2f39] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary dark:text-outline">sync</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-on-surface dark:text-white">Token Reset: <span className="font-bold text-primary dark:text-white">Team Engineering</span></p>
                    <p className="text-xs text-secondary dark:text-outline/70">Annual rollover adjustment complete</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-secondary dark:text-outline/65 font-medium">Yesterday</p>
                    <p className="text-[10px] text-secondary dark:text-outline/70 bg-surface-variant dark:bg-[#2d2f39] px-2 py-0.5 rounded-full inline-block mt-1">
                      System
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Burnout Monitor (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-semibold text-lg text-primary dark:text-white">Team Pulse</h4>
                    <p className="text-xs text-secondary dark:text-outline/70">Burnout risk index</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                    <span className="text-xs font-bold">4%</span>
                  </div>
                </div>
                {/* Minimal Chart */}
                <div className="h-32 flex items-end justify-between gap-2 px-2">
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '40%' }}></div>
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '55%' }}></div>
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '35%' }}></div>
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '65%' }}></div>
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '25%' }}></div>
                  <div className="w-full bg-surface-container-highest dark:bg-[#2d2f39] rounded-t-sm transition-all duration-300 hover:bg-primary dark:hover:bg-white" style={{ height: '30%' }}></div>
                  <div className="w-full bg-primary dark:bg-white rounded-t-sm" style={{ height: '20%' }}></div>
                </div>
                <div className="flex justify-between mt-2 px-2 text-[10px] text-secondary dark:text-outline/70">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span className="font-bold text-primary dark:text-white">Sun</span>
                </div>
                <div className="mt-6 p-4 bg-surface-container dark:bg-[#1c1d24] rounded-xl">
                  <p className="text-sm font-semibold text-primary dark:text-white">Optimal Status</p>
                  <p className="text-xs text-secondary dark:text-outline/70 mt-1">
                    Current team workload balance is stable. No critical risks identified for the next 14 days.
                  </p>
                </div>
              </div>

              {/* Shared Calendar Sync */}
              <div className="bg-surface-bright dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="bg-primary dark:bg-white text-on-primary dark:text-black text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-3">
                    NEW FEATURE
                  </span>
                  <h5 className="text-base font-bold text-primary dark:text-white">Shared Calendar Sync</h5>
                  <p className="text-sm text-secondary dark:text-outline/85 mt-1">Connect your Slack and Google Calendar to auto-update status.</p>
                  <button className="mt-4 w-full py-2 border border-primary dark:border-white text-primary dark:text-white font-label-caps text-xs rounded-lg hover:bg-primary hover:text-on-primary dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer font-bold tracking-wider">
                    Enable Sync
                  </button>
                </div>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary-container/50 dark:bg-[#2d2f39]/30 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary dark:bg-white text-on-primary dark:text-black rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group cursor-pointer z-50">
        <span className="material-symbols-outlined">add</span>
        <span className="absolute right-16 bg-on-surface text-on-primary px-3 py-1 rounded-md text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Quick Request
        </span>
      </button>
    </div>
  );
}
