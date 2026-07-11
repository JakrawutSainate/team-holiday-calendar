'use client';

import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useState } from 'react';
import { LeaveTypesController } from './LeaveTypesController';

export default function LeaveTypesClient() {
  const { language } = useTranslation();
  const [controller] = useState(() => new LeaveTypesController());

  const leaveTypes = controller.getLeaveTypes();

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ตรวจสอบกฎการลา...' : 'Check leave protocols...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
              {language === 'th' ? 'เกณฑ์ประเภทการลาและโควตาเริ่มต้น' : 'Leave Types & Quota Guidelines'}
            </h2>
            <p className="text-zinc-500 mt-2 text-base">
              {language === 'th'
                ? 'รายละเอียดเกณฑ์การอนุญาตลาหยุดงาน โควตาสิทธิ์เริ่มต้นประจำปี และจำนวนโทเค็นที่ใช้ในแต่ละประเภท'
                : 'Description of active leave categories, annual default allowances, paid status, and token configurations.'}
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leaveTypes.map((type) => (
              <div
                key={type.code}
                className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Quota */}
                  <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 leading-tight">
                        {language === 'th' ? type.title : type.titleEn}
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5 block">
                        {type.titleEn}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800">
                      {language === 'th' ? type.quota : type.quotaEn}
                    </span>
                  </div>

                  {/* Badges / Stats grid */}
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100/60">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-450 tracking-wider uppercase block">
                        {language === 'th' ? 'จำนวนโทเค็นที่ใช้' : 'Token Cost'}
                      </span>
                      <p className="text-xs font-bold text-zinc-900 mt-0.5">{type.cost}</p>
                      <p className="text-[9px] text-zinc-400 font-medium">
                        {language === 'th' ? type.costDesc : type.costDescEn}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-450 tracking-wider uppercase block">
                        {language === 'th' ? 'สถานะการจ่ายเงิน' : 'Payment Status'}
                      </span>
                      <p className="text-xs font-bold text-zinc-900 mt-0.5">
                        {language === 'th' ? type.paidStatus : type.paidStatusEn}
                      </p>
                      <p className="text-[9px] text-zinc-400 font-medium">
                        {language === 'th' ? 'ได้รับค่าจ้างปกติ' : 'Full Pay Status'}
                      </p>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase block">
                      {language === 'th' ? 'กฎเกณฑ์และหมายเหตุ' : 'Leave Rules & Details'}
                    </span>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                      {language === 'th' ? type.rule : type.ruleEn}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
