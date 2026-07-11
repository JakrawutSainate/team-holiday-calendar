'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import Link from 'next/link';
import { fetchTeamMembersAction, fetchCapacitySettingsAction } from '../actions';
import { MasterDataHubController } from './MasterDataHubController';

export default function MasterDataHubClient() {
  const { user } = useAuth();
  const { role } = useRole();
  const { language } = useTranslation();

  const [, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [controller] = useState(() => new MasterDataHubController(() => setTick(t => t + 1)));

  useEffect(() => {
    controller.loadData(fetchTeamMembersAction, fetchCapacitySettingsAction).finally(() => {
      setIsLoading(false);
    });
  }, [controller]);

  const totalMembers = controller.getTotalMembers();
  const membersWithSignature = controller.getMembersWithSignature();
  const missingSignatures = controller.getMissingSignatures();
  const totalHolidays = controller.getTotalHolidays();
  const uniqueDepartments = controller.getUniqueDepartments();
  const capacityLimit = controller.getCapacityLimit();

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
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
              {language === 'th' ? 'ข้อมูลหลัก (Master Data)' : 'Master Data Hub'}
            </h2>
            <p className="text-zinc-500 mt-2 text-base">
              {language === 'th'
                ? 'แดชบอร์ดศูนย์กลางสำหรับข้อมูลพื้นฐาน เกณฑ์การทำงาน ข้อมูลพนักงาน และวันหยุดนักขัตฤกษ์ขององค์กร'
                : 'Central dashboard for organizational master data, leaves quotas, active members and rules.'}
            </p>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-3 text-zinc-400">
              <span className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-200 border-t-zinc-900"></span>
              <span className="text-xs font-semibold">
                {language === 'th' ? 'กำลังดึงข้อมูลระบบ...' : 'Fetching system directories...'}
              </span>
            </div>
          ) : (
            <>
              {/* Signature Verification Alert */}
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-650">security</span>
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
                    className="bg-white border border-zinc-100/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between group"
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
