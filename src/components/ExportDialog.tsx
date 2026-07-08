'use client';

import { useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { TeamMember } from '@/src/libs/calendarData';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  members: TeamMember[];
  onConfirmExport: (format: 'PDF' | 'EXCEL', selectedUserId: string) => void;
}

export function ExportDialog({ open, onClose, members, onConfirmExport }: ExportDialogProps) {
  const { language } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState('all');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-sm w-full p-8 space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-900">
            {language === 'th' ? 'ส่งออกข้อมูลวันหยุด' : 'Export Calendar Report'}
          </h3>
          <p className="text-sm text-zinc-500">
            {language === 'th'
              ? 'กรุณาเลือกรายชื่อพนักงานที่ต้องการดึงรายงาน'
              : 'Please select a team member to generate report.'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            {language === 'th' ? 'พนักงาน' : 'Select Employee'}
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900 font-semibold"
          >
            <option value="all">
              {language === 'th' ? 'ทุกคน (All Users)' : 'All Users'}
            </option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.title})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onConfirmExport('EXCEL', selectedUserId);
              onClose();
            }}
            className="px-4 py-3 border border-zinc-200 text-zinc-700 hover:border-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg text-emerald-600">table_view</span>
            Excel
          </button>
          <button
            onClick={() => {
              onConfirmExport('PDF', selectedUserId);
              onClose();
            }}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg text-red-400">picture_as_pdf</span>
            PDF
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold underline cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
