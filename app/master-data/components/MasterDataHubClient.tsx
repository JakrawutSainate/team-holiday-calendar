'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import Link from 'next/link';
import { useMasterData } from './MasterDataContext';
import { MasterDataHubController } from './MasterDataHubController';
import { SkeletonHeader, SkeletonCardGrid } from './Skeleton';

export default function MasterDataHubClient() {
  const { user } = useAuth();
  const { role } = useRole();
  const { language } = useTranslation();
  const { members, capacitySettings, isLoading, error, refreshData } = useMasterData();

  const [, setTick] = useState(0);
  const [controller] = useState(() => new MasterDataHubController(() => setTick(t => t + 1)));

  // Sync context data to local OOP controller
  useEffect(() => {
    if (members.length > 0 || capacitySettings.length > 0) {
      controller.setLocalData(members, capacitySettings);
    }
  }, [members, capacitySettings, controller]);

  const totalMembers = controller.getTotalMembers();
  const membersWithSignature = controller.getMembersWithSignature();
  const missingSignatures = controller.getMissingSignatures();
  const totalHolidays = controller.getTotalHolidays();
  const uniqueDepartments = controller.getUniqueDepartments();
  const capacityLimit = controller.getCapacityLimit();
  const totalActiveTokens = controller.getTotalActiveTokens();

  const categories = [
    {
      id: 'signatures',
      title: 'คลังลายเซ็น',
      titleEn: 'Signature Library',
      desc: 'คลังรวบรวมรูปภาพลายเซ็นพนักงานที่อัปโหลดไว้ในระบบ',
      descEn: 'Directory of electronic signatures saved by members.',
      href: '/master-data/signatures',
      icon: 'draw',
      metric: `${membersWithSignature}/${totalMembers}`,
      metricLabel: 'ลายเซ็นที่บันทึกแล้ว',
      metricLabelEn: 'Signatures saved',
    },
    {
      id: 'users',
      title: 'ข้อมูลผู้ใช้งานและโควตา',
      titleEn: 'User Data & Quotas',
      desc: 'รายชื่อบุคลากร สิทธิ์ ยอดสะสมโทเค็น และโควตาวันลาทั้งหมด',
      descEn: 'Employee profiles, role structures, and leave balance quotas.',
      href: '/master-data/users',
      icon: 'badge',
      metric: totalMembers,
      metricLabel: 'สมาชิกทั้งหมด',
      metricLabelEn: 'Total members',
    },
    {
      id: 'holidays',
      title: 'วันหยุดนักขัตฤกษ์',
      titleEn: 'Public Holidays',
      desc: 'ปฏิทินวันหยุดราชการประจำปีของธนาคารแห่งประเทศไทย',
      descEn: 'Bank of Thailand public holiday calendar and labels.',
      href: '/master-data/holidays',
      icon: 'calendar_today',
      metric: totalHolidays,
      metricLabel: 'วันหยุดในปี 2026',
      metricLabelEn: 'Holidays in 2026',
    },
    {
      id: 'capacities',
      title: 'ขีดจำกัดคนลาประจำวัน',
      titleEn: 'Capacity Settings',
      desc: 'โควตาจำนวนคนลาสูงสุดที่ระบบอนุญาตในแต่ละวันทำงาน',
      descEn: 'Workload safety limits and daily off allowed rules.',
      href: '/master-data/capacities',
      icon: 'speed',
      metric: `${capacityLimit} คน/วัน`,
      metricLabel: 'ขีดจำกัดลาสูงสุด',
      metricLabelEn: 'Max allowed off daily',
    },
    {
      id: 'departments',
      title: 'แผนกและตำแหน่ง',
      titleEn: 'Departments & Titles',
      desc: 'ภาพรวมโครงสร้างแผนกและตำแหน่งงานของพนักงาน',
      descEn: 'Overview of company divisions and title definitions.',
      href: '/master-data/departments',
      icon: 'schema',
      metric: uniqueDepartments,
      metricLabel: 'แผนกที่ใช้งาน',
      metricLabelEn: 'Active departments',
    },
    {
      id: 'leave-types',
      title: 'ประเภทการลา',
      titleEn: 'Leave Types',
      desc: 'ประเภทคำขอลา กฎเกณฑ์ และเกณฑ์จำนวนโควตาวันลาเริ่มต้น',
      descEn: 'Descriptions, terms, and default allowances of leave categories.',
      href: '/master-data/leave-types',
      icon: 'format_list_bulleted',
      metric: '4 ประเภท',
      metricLabel: 'ประเภทวันลาในระบบ',
      metricLabelEn: 'Leave configurations',
    },
  ];

  const adminCategories = [
    ...categories,
    ...(role === 'ADMIN'
      ? [
          {
            id: 'audit-logs',
            title: 'ประวัติระบบ (Audit Logs)',
            titleEn: 'Audit Logs',
            desc: 'ประวัติการบันทึกการกระทำและการตั้งค่าระบบทั้งหมดของผู้ดูแลระบบ',
            descEn: 'Trace log of administrative settings and status updates.',
            href: '/master-data/audit-logs',
            icon: 'history',
            metric: 'ตรวจสอบได้',
            metricLabel: 'บันทึกความโปร่งใส',
            metricLabelEn: 'Transparency log',
          },
        ]
      : []),
  ];

  const isUserSignatureSaved = user?.savedSignature ? true : false;

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder="ค้นหาข้อมูลหลัก..." />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'ข้อมูลหลัก (Master Data)' : 'Master Data Hub'}
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
                  ? 'แดชบอร์ดศูนย์กลางสำหรับข้อมูลพื้นฐาน เกณฑ์การทำงาน ข้อมูลพนักงาน และวันหยุดนักขัตฤกษ์ขององค์กร'
                  : 'Central dashboard for organizational master data, leaves quotas, active members and rules.'}
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
              <div className="h-24 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
              <SkeletonCardGrid count={6} />
            </div>
          ) : (
            <>
              {/* Top Summary Cards (Active Tokens summary included) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                    {language === 'th' ? 'สมาชิกทั้งหมด' : 'Total Members'}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-zinc-900">{totalMembers}</span>
                    <span className="material-symbols-outlined text-zinc-300 text-2xl">groups</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                    {language === 'th' ? 'อัตราความครอบคลุมลายเซ็น' : 'Signature Coverage'}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-zinc-900">
                      {Math.round((membersWithSignature / (totalMembers || 1)) * 100)}%
                    </span>
                    <span className="material-symbols-outlined text-zinc-300 text-2xl">draw</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                    {language === 'th' ? 'ยอดสะสมโทเค็นรวมทั้งองค์กร' : 'Total Organization Tokens'}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-black text-zinc-900">{totalActiveTokens.toFixed(1)}</span>
                    <span className="material-symbols-outlined text-zinc-300 text-2xl">token</span>
                  </div>
                </div>
              </div>

              {/* Signature Verification Alert */}
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-600">security</span>
                  {language === 'th' ? 'การตรวจสอบระบบลายเซ็น' : 'Signature Compliance Check'}
                </h3>

                {role === 'ADMIN' ? (
                  <div>
                    <div className="flex justify-between text-sm text-zinc-600 mb-2 font-semibold">
                      <span>
                        {language === 'th' ? 'ความครอบคลุมของลายเซ็นในองค์กร:' : 'Total signature coverage:'}
                      </span>
                      <span className="text-zinc-900 font-bold">
                        {membersWithSignature} {language === 'th' ? 'จาก' : 'of'} {totalMembers} {language === 'th' ? 'คน' : 'members'} ({Math.round((membersWithSignature / (totalMembers || 1)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div
                        className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(membersWithSignature / (totalMembers || 1)) * 100}%` }}
                      ></div>
                    </div>
                    {missingSignatures.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-100">
                        <span className="text-xs font-bold text-amber-600 block mb-2">
                          ⚠️ {language === 'th' ? `สมาชิกที่ยังไม่ได้บันทึกลายเซ็น (${missingSignatures.length} คน):` : `Members missing signature (${missingSignatures.length}):`}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {missingSignatures.map((m) => (
                            <span
                              key={m.id}
                              className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-xs font-semibold"
                            >
                              {m.name} ({m.department})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm">
                      <p className="text-zinc-600 font-medium">
                        {language === 'th' ? 'สถานะลายเซ็นปัจจุบันของคุณ:' : 'Your signature status:'}
                      </p>
                      {isUserSignatureSaved ? (
                        <span className="text-green-700 font-bold flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          {language === 'th' ? 'บันทึกลายเซ็นในระบบแล้ว' : 'Saved in system'}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-base">error</span>
                          {language === 'th' ? 'ยังไม่ได้บันทึกลายเซ็น' : 'Missing signature (Required for leave requests)'}
                        </span>
                      )}
                    </div>
                    {!isUserSignatureSaved && (
                      <Link
                        href="/settings"
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        {language === 'th' ? 'ไปตั้งค่าลายเซ็น' : 'Draw Signature'}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-900 transition-colors text-3xl">
                          {cat.icon}
                        </span>
                        <span className="px-3 py-1 bg-zinc-50 border border-zinc-200/50 rounded-xl text-[11px] font-bold text-zinc-650">
                          {cat.metric}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-900 group-hover:text-zinc-950">
                          {language === 'th' ? cat.title : cat.titleEn}
                        </h4>
                        <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 tracking-wide uppercase">
                          {cat.titleEn}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {language === 'th' ? cat.desc : cat.descEn}
                      </p>
                    </div>

                    <div className="border-t border-zinc-50 mt-5 pt-4 flex items-center justify-between">
                      <div className="text-[10px] font-semibold text-zinc-400">
                        {language === 'th' ? cat.metricLabel : cat.metricLabelEn}
                      </div>
                      <span className="material-symbols-outlined text-zinc-400 group-hover:translate-x-1 transition-transform text-sm">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
