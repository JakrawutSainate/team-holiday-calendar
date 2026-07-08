'use client';

import { useTranslation } from '@/src/components/LanguageContext';

interface LeaveRequestData {
  reason?: string;
  signatureType: 'DRAW' | 'TEXT';
  signatureText?: string;
  signatureImage?: string;
  attachmentImage?: string;
}

interface LeaveDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  leaveDate: string;
  userName: string;
  leaveRequest?: LeaveRequestData;
}

export function LeaveDetailsDialog({ open, onClose, leaveDate, userName, leaveRequest }: LeaveDetailsDialogProps) {
  const { language } = useTranslation();

  if (!open) return null;

  const formattedDate = new Date(leaveDate).toLocaleDateString(
    language === 'en' ? 'en-US' : 'th-TH',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
              {language === 'th' ? 'รายละเอียดใบลาอิเล็กทรอนิกส์' : 'E-Leave Document Details'}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              {language === 'th' ? 'เอกสารใบลาได้รับการอนุมัติอัตโนมัติ' : 'This request has been auto-approved.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
              {language === 'th' ? 'ผู้ขออนุญาตลา' : 'Applicant'}
            </span>
            <span className="text-base font-bold text-zinc-900 mt-1 block">
              {userName}
            </span>
          </div>
          <div className="bg-zinc-50 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
              {language === 'th' ? 'วันที่ลาหยุด' : 'Leave Date'}
            </span>
            <span className="text-base font-bold text-zinc-900 mt-1 block">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Leave details & attachment */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              {language === 'th' ? 'เหตุผลการลา' : 'Reason for Leave'}
            </span>
            <p className="text-sm text-zinc-800 bg-zinc-50/50 border border-zinc-100 p-4 rounded-2xl leading-relaxed whitespace-pre-line">
              {leaveRequest?.reason || (language === 'th' ? 'ยื่นขอวันลาหยุดพักผ่อน' : 'Compensatory Leave')}
            </p>
          </div>

          {leaveRequest?.attachmentImage && (
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                {language === 'th' ? 'เอกสารแนบประกอบ' : 'Attached Document'}
              </span>
              <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leaveRequest.attachmentImage}
                  alt="Attachment Document"
                  className="max-h-[250px] w-full object-contain mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Signature Area */}
        <div className="border-t border-zinc-100 pt-6">
          <div className="flex flex-col items-center justify-center border border-zinc-200 border-dashed rounded-2xl p-6 bg-zinc-50/20 max-w-sm mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 block">
              {language === 'th' ? 'ลายมือชื่อผู้ลา (Signature)' : 'Authorized Signature'}
            </span>
            {leaveRequest?.signatureType === 'DRAW' && leaveRequest.signatureImage ? (
              <div className="h-16 w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leaveRequest.signatureImage}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <span className="text-2xl font-bold font-serif italic tracking-wide text-zinc-800 border-b border-zinc-300 px-6 py-2">
                {leaveRequest?.signatureText || userName}
              </span>
            )}
            <span className="text-[10px] text-zinc-400 mt-4">
              {language === 'th' ? 'ลงชื่ออิเล็กทรอนิกส์แล้วอย่างถูกต้อง' : 'Digitally Signed & Verified'}
            </span>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {language === 'th' ? 'ปิดหน้านี้' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
