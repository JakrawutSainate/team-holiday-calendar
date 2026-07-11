'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import { CapacitiesController } from './CapacitiesController';
import { SkeletonHeader, SkeletonTable } from './Skeleton';

export default function CapacitiesClient() {
  const { language } = useTranslation();
  const { capacitySettings, isLoading, error, refreshData } = useMasterData();

  const [, setTick] = useState(0);
  const [controller] = useState(() => new CapacitiesController(() => setTick(t => t + 1)));

  // Sync context settings into controller
  useEffect(() => {
    if (capacitySettings.length > 0) {
      controller.loadData(() => Promise.resolve(capacitySettings));
    }
  }, [capacitySettings, controller]);

  const globalDefault = controller.getGlobalDefault();
  const overrides = controller.getOverrides();
  const earnRate = controller.getEarnRate();

  const getDayName = (dow: number) => {
    const days = [
      language === 'th' ? 'วันอาทิตย์' : 'Sunday',
      language === 'th' ? 'วันจันทร์' : 'Monday',
      language === 'th' ? 'วันอังคาร' : 'Tuesday',
      language === 'th' ? 'วันพุธ' : 'Wednesday',
      language === 'th' ? 'วันพฤหัสบดี' : 'Thursday',
      language === 'th' ? 'วันศุกร์' : 'Friday',
      language === 'th' ? 'วันเสาร์' : 'Saturday'
    ];
    return days[dow] || String(dow);
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ตรวจสอบกฎคนลา...' : 'Check workload capacity rules...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'ขีดจำกัดคนลาและอัตราการเคลมเวร' : 'Capacity Settings & Multipliers'}
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
                  ? 'ขีดจำกัดโควตาการลาหยุดงานสูงสุดต่อวัน และอัตราค่าตอบแทนโทเค็นเมื่อทำงานวันหยุด'
                  : 'Workspace thresholds for maximum concurrent leaves and weekend shift token earn rates.'}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="h-32 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
                  <div className="h-32 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
                </div>
                <div className="lg:col-span-2">
                  <SkeletonTable rows={4} cols={3} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Summary Cards */}
              <div className="lg:col-span-1 space-y-6">
                {/* Global Default Card */}
                <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <span className="material-symbols-outlined text-zinc-400 text-3xl">public</span>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                      {language === 'th' ? 'ขีดจำกัดปกติทั่วไป (เริ่มต้น)' : 'Global Default Limit'}
                    </span>
                    <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                      {globalDefault?.maxOffAllowed ?? 2} {language === 'th' ? 'คน / วัน' : 'People / Day'}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {language === 'th'
                      ? 'จำนวนพนักงานสูงสุดในองค์กรที่อนุญาตให้ลาหยุดพร้อมกันในวันเดียวกันได้ในสภาวะปกติ'
                      : 'The default maximum number of active employees allowed to take leave on the same work day.'}
                  </p>
                </div>

                {/* Overtime Earn Rate Card */}
                <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <span className="material-symbols-outlined text-zinc-400 text-3xl">account_balance_wallet</span>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                      {language === 'th' ? 'ตัวคูณโทเค็นปฏิบัติงานวันหยุด' : 'Weekend Shift Earn Rate'}
                    </span>
                    <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                      {earnRate}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {language === 'th'
                      ? 'ตัวคูณเพิ่มจำนวนโทเค็นสะสมที่ผู้ใช้จะได้รับ เมื่อทำงานเวรล่วงเวลาในเสาร์-อาทิตย์หรือวันหยุดราชการ'
                      : 'Accrual multiplier awarded to employees when submitting shift coverage approvals on weekends.'}
                  </p>
                </div>
              </div>

              {/* Right Side: Specific Overrides Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-zinc-155 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {language === 'th' ? 'เงื่อนไขพิเศษและวันยกเว้น' : 'Capacity Settings Overrides'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {language === 'th'
                        ? 'กฎการจำกัดจำนวนการลาเพิ่มเติมเฉพาะเจาะจงรายวัน หรือรายวันในสัปดาห์ (เช่น ล็อกเวรเสาร์-อาทิตย์ ห้ามลา)'
                        : 'Specific rules that override the global default limit for targeted dates or calendar weekdays.'}
                    </p>
                  </div>

                  <div className="border border-zinc-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            {language === 'th' ? 'ประเภทเงื่อนไข' : 'OVERRIDE TYPE'}
                          </th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                            {language === 'th' ? 'จำนวนจำกัดคนลา' : 'MAX ALLOWED'}
                          </th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            {language === 'th' ? 'รายละเอียด/หมายเหตุ' : 'DESCRIPTION'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map((ov) => (
                          <tr key={ov.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/20 transition-colors">
                            <td className="p-4 text-sm font-bold text-zinc-900">
                              {ov.date ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-md inline-block w-fit mb-1">
                                    {language === 'th' ? 'เฉพาะวันที่' : 'Specific Date'}
                                  </span>
                                  <span>{ov.date}</span>
                                </div>
                              ) : ov.dayOfWeek != null ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-md inline-block w-fit mb-1">
                                    {language === 'th' ? 'วันของสัปดาห์' : 'Day of Week'}
                                  </span>
                                  <span>{getDayName(ov.dayOfWeek)}</span>
                                </div>
                              ) : (
                                'Custom override'
                              )}
                            </td>
                            <td className="p-4 text-sm font-bold text-zinc-900 text-center">
                              {ov.maxOffAllowed === 0 ? (
                                <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs font-bold">
                                  {language === 'th' ? 'ล็อกการลา (0 คน)' : 'Locked (0 People)'}
                                </span>
                              ) : (
                                <span>{ov.maxOffAllowed} {language === 'th' ? 'คน' : 'People'}</span>
                              )}
                            </td>
                            <td className="p-4 text-xs text-zinc-505 font-medium font-semibold leading-relaxed">
                              {ov.description || '-'}
                            </td>
                          </tr>
                        ))}
                        {overrides.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-xs text-zinc-400 font-semibold">
                              {language === 'th' ? 'ไม่มีเงื่อนไขข้อยกเว้นพิเศษในระบบ' : 'No custom overrides configured.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
