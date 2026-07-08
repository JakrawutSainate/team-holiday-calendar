'use client';

import { useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';

interface AddTokenDialogProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
  onConfirm: (amount: number, description: string) => void;
}

export function AddTokenDialog({ open, onClose, memberName, onConfirm }: AddTokenDialogProps) {
  const { language } = useTranslation();
  const [amount, setAmount] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (amount <= 0) {
      setError(language === 'th' ? 'กรุณาระบุจำนวนโทเค็นมากกว่า 0' : 'Amount must be greater than 0');
      return;
    }
    onConfirm(amount, description);
    setAmount(1);
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-sm w-full p-8 space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-900">
            {language === 'th' ? 'เพิ่มโทเค็นให้พนักงาน' : 'Add User Tokens'}
          </h3>
          <p className="text-sm text-zinc-500 font-medium">
            {language === 'th'
              ? `พนักงาน: ${memberName}`
              : `Employee: ${memberName}`}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              {language === 'th' ? 'จำนวนโทเค็น' : 'Token Amount'}
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setError('');
              }}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              {language === 'th' ? 'หมายเหตุ / คำอธิบาย' : 'Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'th' ? 'เช่น ทำงานกะพิเศษ, โบนัสสะสม...' : 'e.g. Special shift credit...'}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-colors cursor-pointer"
          >
            {language === 'th' ? 'ยืนยันเพิ่มโทเค็น' : 'Add Tokens'}
          </button>
        </div>
      </div>
    </div>
  );
}
