'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import Link from 'next/link';
import { useMasterData } from './MasterDataContext';
import { SignatureLibraryController } from './SignatureLibraryController';
import { SkeletonHeader, SkeletonCardGrid } from './Skeleton';

export default function SignatureLibraryClient() {
  const { user } = useAuth();
  const { role } = useRole();
  const { language } = useTranslation();
  const { members, isLoading, error, refreshData } = useMasterData();

  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [controller] = useState(() => new SignatureLibraryController(() => setTick(t => t + 1)));

  // Sync context members into controller
  useEffect(() => {
    if (members.length > 0) {
      controller.setMembers(members);
    }
  }, [members, controller]);

  const filteredMembers = controller.getFilteredMembers(searchQuery, selectedDept);
  const currentUserData = controller.getMembers().find((m) => m.id === user?.id) || user;

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาลายเซ็นพนักงาน...' : 'Search employee signatures...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'คลังลายเซ็นพนักงาน' : 'Signature Library'}
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
                  ? 'ตรวจสอบความถูกต้องของลายเซ็นที่ใช้ในการลงนามคำขอลาอิเล็กทรอนิกส์'
                  : 'Review saved signatures used for automated electronic leave document approvals.'}
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
              <SkeletonCardGrid count={6} />
            </div>
          ) : (
            <>
              {role === 'ADMIN' ? (
                <div className="space-y-6">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-4 bg-white border border-zinc-150 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-zinc-50/50 border border-zinc-200/60 rounded-xl">
                      <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
                      <input
                        type="text"
                        placeholder={language === 'th' ? 'ค้นหาตามชื่อ, อีเมล, ตำแหน่ง...' : 'Search by name, email, title...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-850 placeholder-zinc-400"
                      />
                    </div>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="px-4 py-2 border border-zinc-200/60 rounded-xl bg-white text-xs font-bold text-zinc-800 hover:bg-zinc-50 outline-none cursor-pointer"
                    >
                      <option value="ALL">{language === 'th' ? 'ทุกแผนก' : 'All Departments'}</option>
                      <option value="Engineering">{language === 'th' ? 'ฝ่ายวิศวกรรม' : 'Engineering'}</option>
                      <option value="Design">{language === 'th' ? 'ฝ่ายออกแบบ' : 'Design'}</option>
                      <option value="Management">{language === 'th' ? 'ฝ่ายบริหาร' : 'Management'}</option>
                    </select>
                  </div>

                  {/* Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
                      >
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-900">
                              {m.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-sm font-bold text-zinc-900 truncate">{m.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-semibold truncate">{m.title} ({m.department})</p>
                            </div>
                          </div>
                        </div>

                        {/* Signature Render Box */}
                        <div className="h-32 bg-zinc-50 border-t border-b border-zinc-100 flex items-center justify-center overflow-hidden p-2 relative group">
                          {m.savedSignature ? (
                            <img
                              src={m.savedSignature}
                              alt={`${m.name}'s Signature`}
                              className="max-h-full max-w-full object-contain filter invert opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-200"
                            />
                          ) : (
                            <span className="text-xs text-zinc-400 font-bold">
                              {language === 'th' ? 'ยังไม่ได้บันทึกลายเซ็น' : 'No Saved Signature'}
                            </span>
                          )}
                        </div>

                        <div className="p-4 bg-zinc-50/20 text-center">
                          <span className="text-[10px] text-zinc-400 font-semibold truncate block">
                            ID: {m.id}
                          </span>
                        </div>
                      </div>
                    ))}

                    {filteredMembers.length === 0 && (
                      <div className="col-span-full py-16 text-center text-zinc-450 bg-white border border-zinc-100 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300 animate-pulse">search_off</span>
                        <p className="text-sm font-semibold">
                          {language === 'th' ? 'ไม่พบลายเซ็นตามที่ค้นหา' : 'No employee signatures found.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular User view: show self signature only */
                <div className="max-w-lg mx-auto bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
                  <div className="p-6 border-b border-zinc-100 space-y-4">
                    <h3 className="text-lg font-bold text-zinc-900">
                      {language === 'th' ? 'ลายเซ็นที่บันทึกของฉัน' : 'My Saved Signature'}
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-800">
                        {currentUserData?.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{currentUserData?.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-semibold">{currentUserData?.title} ({currentUserData?.department})</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-44 bg-zinc-50 flex items-center justify-center overflow-hidden p-6 border-b border-zinc-100">
                    {currentUserData?.savedSignature ? (
                      <img
                        src={currentUserData.savedSignature}
                        alt="Your Saved Signature"
                        className="max-h-full max-w-full object-contain filter invert opacity-95"
                      />
                    ) : (
                      <div className="text-center space-y-3">
                        <p className="text-xs text-zinc-400 font-semibold">
                          {language === 'th' ? 'คุณยังไม่ได้บันทึกลายเซ็นไว้ในระบบ' : 'You have not saved a signature yet.'}
                        </p>
                        <Link
                          href="/settings"
                          className="inline-block px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {language === 'th' ? 'ไปวาดลายเซ็นที่หน้าตั้งค่า' : 'Draw signature in Settings'}
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="p-4 text-center bg-zinc-50/20">
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {language === 'th'
                        ? '*ใช้สำหรับยื่นใบลาอย่างเป็นทางการเพื่ออนุมัติโดยระบบอัตโนมัติ'
                        : '*Used automatically for official leave document signatures.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
