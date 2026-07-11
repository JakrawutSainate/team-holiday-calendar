'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import { DepartmentsController } from './DepartmentsController';
import { SkeletonHeader, SkeletonCardGrid } from './Skeleton';

export default function DepartmentsClient() {
  const { language } = useTranslation();
  const { members, isLoading, error, refreshData } = useMasterData();

  const [, setTick] = useState(0);
  const [controller] = useState(() => new DepartmentsController(() => setTick(t => t + 1)));

  // Sync context members into controller
  useEffect(() => {
    if (members.length > 0) {
      controller.loadData(() => Promise.resolve(members));
    }
  }, [members, controller]);

  const departmentGroups = controller.getDepartmentGroups();

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case 'Engineering':
        return 'code';
      case 'Design':
        return 'draw';
      case 'Management':
        return 'corporate_fare';
      default:
        return 'groups';
    }
  };

  const translateDepartment = (dept: string) => {
    if (language === 'en') return dept;
    switch (dept) {
      case 'Engineering':
        return 'ฝ่ายวิศวกรรม (Engineering)';
      case 'Design':
        return 'ฝ่ายออกแบบ (Design)';
      case 'Management':
        return 'ฝ่ายบริหาร (Management)';
      default:
        return dept;
    }
  };

  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO';

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ตรวจสอบรายชื่อแผนก...' : 'Check corporate structures...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'ข้อมูลแผนกและตำแหน่งงาน' : 'Departments & Titles'}
                </h2>
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-zinc-100 rounded-xl transition-all border-none outline-none cursor-pointer flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 disabled:opacity-50"
                  title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
                >
                  <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
              <p className="text-zinc-500 mt-2 text-base">
                {language === 'th'
                  ? 'โครงสร้างการจัดแผนก รายละเอียดชื่อตำแหน่งของพนักงาน และจำนวนสมาชิกที่ทำงานอยู่'
                  : 'Structure directory of corporate branches, operational titles and active employees.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <SkeletonHeader />
              <div className="h-16 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
              <SkeletonCardGrid count={3} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departmentGroups.map((dept) => (
                <div
                  key={dept.name}
                  className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Title & Badge */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-zinc-400 text-3xl">
                          {getDepartmentIcon(dept.name)}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 leading-tight">
                            {translateDepartment(dept.name)}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-805">
                        {dept.headcount} {language === 'th' ? 'คน' : 'Members'}
                      </span>
                    </div>

                    {/* Titles inside Department */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                        {language === 'th' ? 'ตำแหน่งงานที่มีในแผนก' : 'Active Titles'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.titles.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-zinc-50 border border-zinc-200/60 text-zinc-650 rounded-lg text-xs font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Employees */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                        {language === 'th' ? 'รายชื่อพนักงาน' : 'Active Members'}
                      </span>
                      <div className="flex flex-col gap-2">
                        {dept.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-zinc-50 rounded-lg transition-colors">
                            <img
                              src={m.avatarUrl || defaultAvatar}
                              alt={m.name}
                              className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                            />
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-zinc-900 truncate leading-normal">{m.name}</p>
                              <p className="text-[9px] text-zinc-450 font-semibold truncate leading-none">{m.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {departmentGroups.length === 0 && (
                <div className="col-span-full py-16 text-center text-zinc-450 bg-white border border-zinc-100 rounded-2xl">
                  <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">groups_3</span>
                  <p className="text-sm font-semibold">
                    {language === 'th' ? 'ไม่พบข้อมูลแผนกงานในระบบ' : 'No departments active in system.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
