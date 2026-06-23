'use client';

import { useState } from 'react';

interface LeaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (date: string) => void;
  tokens: number;
  language: string;
}

export function LeaveFormDialog({ open, onClose, onSubmit, tokens, language }: LeaveFormDialogProps) {
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setDate('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!date) {
      setError(language === 'th' ? 'กรุณาเลือกวันที่ต้องการลา' : 'Please select a date');
      return;
    }
    const day = new Date(date).getDay();
    if (day === 0 || day === 6) {
      setError(language === 'th' ? 'ไม่สามารถลาหยุดในวันเสาร์-อาทิตย์ได้' : 'Cannot request leave on weekends');
      return;
    }
    onSubmit(date);
    setDate('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-100 max-w-sm w-full p-8 space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-900">
            {language === 'th' ? 'ส่งใบลาวันหยุด' : 'Request Leave'}
          </h3>
          <p className="text-sm text-zinc-500">
            {language === 'th'
              ? `ใช้ 1 โทเค็นต่อวัน · โทเค็นของคุณ: ${tokens} โทเค็น`
              : `Costs 1 token per day · Balance: ${tokens} tokens`}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            {language === 'th' ? 'เลือกวันที่ต้องการลา' : 'Select Leave Date'}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setError(''); }}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900"
          />
          {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            {language === 'th' ? 'ส่งใบลา' : 'Request Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}
