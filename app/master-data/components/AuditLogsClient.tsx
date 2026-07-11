'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { fetchAuditLogsAction } from '../actions';
import { useRole } from '@/src/components/RoleContext';
import { AuditLogsController } from './AuditLogsController';

export default function AuditLogsClient() {
  const { language } = useTranslation();
  const { role } = useRole();

  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [controller] = useState(() => new AuditLogsController(() => setTick(t => t + 1)));

  useEffect(() => {
    if (role === 'ADMIN') {
      controller.loadData(fetchAuditLogsAction).finally(() => {
        setIsLoading(false);
      });
    }
  }, [role, controller]);

  const filteredLogs = controller.getFilteredLogs(searchQuery, selectedAction);

  const handleExport = () => {
    controller.exportToCSV(filteredLogs, language);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE_CAPACITY':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'แก้จำกัดคนลา' : 'Capacity Limit'}</span>;
      case 'ADD_TOKENS':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'เพิ่มโทเค็น' : 'Award Tokens'}</span>;
      case 'APPROVE_LEAVE':
        return <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'อนุมัติลา' : 'Approve Leave'}</span>;
      case 'REJECT_LEAVE':
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'ปฏิเสธลา' : 'Reject Leave'}</span>;
      case 'DELETE_DOCUMENT':
        return <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold">{language === 'th' ? 'ลบเอกสารลา' : 'Delete Document'}</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-zinc-50 text-zinc-700 border border-zinc-150 rounded-lg text-xs font-semibold">{action}</span>;
    }
  };

  if (role !== 'ADMIN') {
    return (
      <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background items-center justify-center p-12">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-red-500 text-5xl">gpp_bad</span>
          <h2 className="text-xl font-bold text-zinc-900">เข้าถึงไม่ได้ (Access Denied)</h2>
          <p className="text-sm text-zinc-500 max-w-sm">
            หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นในการเข้าถึงข้อมูลประวัติการทำงานของระบบ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาประวัติระบบ...' : 'Search transparency logs...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                {language === 'th' ? 'ประวัติความโปร่งใสระบบ (Audit Logs)' : 'Transparency Audit Logs'}
              </h2>
              <p className="text-zinc-500 mt-2 text-base">
                {language === 'th'
                  ? 'ตรวจสอบบันทึกประวัติการกระทำหรือตั้งค่าสำคัญโดยผู้ดูแลระบบแบบเรียลไทม์'
                  : 'Review logged administrative modifications and status changes in real-time.'}
              </p>
            </div>
            {!isLoading && filteredLogs.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border-none outline-none"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {language === 'th' ? 'ส่งออกล็อก CSV' : 'Export Logs'}
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white border border-zinc-150 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-zinc-50/50 border border-zinc-200/60 rounded-xl">
              <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
              <input
                type="text"
                placeholder={language === 'th' ? 'ค้นหาตามชื่อผู้ปฏิบัติการ หรือข้อมูลบันทึก...' : 'Search by operator name or action details...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 placeholder-zinc-400"
              />
            </div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 border border-zinc-200/60 rounded-xl bg-white text-xs font-bold text-zinc-800 hover:bg-zinc-50 outline-none cursor-pointer"
            >
              <option value="ALL">{language === 'th' ? 'ทุกประเภท' : 'All Action Types'}</option>
              <option value="UPDATE_CAPACITY">{language === 'th' ? 'แก้ไขจำกัดคนลา' : 'Capacity Changes'}</option>
              <option value="ADD_TOKENS">{language === 'th' ? 'เพิ่มโทเค็น' : 'Award Tokens'}</option>
              <option value="APPROVE_LEAVE">{language === 'th' ? 'อนุมัติคำขอลา' : 'Leave Approvals'}</option>
              <option value="REJECT_LEAVE">{language === 'th' ? 'ปฏิเสธคำขอลา' : 'Leave Rejections'}</option>
              <option value="DELETE_DOCUMENT">{language === 'th' ? 'ลบเอกสารลา' : 'Delete Document'}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-3 text-zinc-400">
              <span className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-200 border-t-zinc-900"></span>
              <span className="text-xs font-semibold">
                {language === 'th' ? 'กำลังโหลดประวัติระบบ...' : 'Loading audit logs...'}
              </span>
            </div>
          ) : (
            <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="p-4 pl-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/5">
                        {language === 'th' ? 'วันที่ / เวลา' : 'TIMESTAMP'}
                      </th>
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/5">
                        {language === 'th' ? 'ผู้ดำเนินการ (Admin)' : 'OPERATOR'}
                      </th>
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/5">
                        {language === 'th' ? 'การกระทำ' : 'ACTION TYPE'}
                      </th>
                      <th className="p-4 pr-6 text-xs font-bold text-zinc-500 uppercase tracking-wider w-2/5">
                        {language === 'th' ? 'รายละเอียด' : 'DETAILS'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const displayTime = new Date(log.createdAt).toLocaleString(
                        language === 'en' ? 'en-US' : 'th-TH',
                        { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
                      );
                      return (
                        <tr key={log.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-semibold text-zinc-700">
                            {displayTime}
                          </td>
                          <td className="p-4 text-sm font-bold text-zinc-900">
                            {log.userName}
                          </td>
                          <td className="p-4 text-sm">
                            {getActionBadge(log.action)}
                          </td>
                          <td className="p-4 pr-6 text-xs font-semibold text-zinc-505 whitespace-pre-wrap leading-relaxed">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-sm text-zinc-400 font-semibold">
                          {language === 'th' ? 'ไม่พบข้อมูลประวัติบันทึกในระบบ' : 'No transparency audit logs found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
