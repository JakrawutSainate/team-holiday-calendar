'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import SignatureCanvas from './SignatureCanvas';

interface LeaveDocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    leaveDate: string;
    leaveType: string;
    reason: string;
    signature: string;
    attachment?: string;
  }) => Promise<void>;
}

export default function LeaveDocumentFormModal({
  isOpen,
  onClose,
  onSubmit
}: LeaveDocumentFormModalProps) {
  const { user } = useAuth();
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL'); // Default to CASUAL
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState('');
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const [attachment, setAttachment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default to using saved signature if available
  useEffect(() => {
    if (user?.savedSignature) {
      setUseSavedSignature(true);
    } else {
      setUseSavedSignature(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!leaveDate) {
      setError('กรุณาเลือกวันที่ต้องการลา / Please select leave date');
      return;
    }
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลการลา / Please provide reason for leave');
      return;
    }

    const finalSignature = useSavedSignature && user?.savedSignature ? user.savedSignature : signature;
    if (!finalSignature) {
      setError('กรุณาลงลายมือชื่อ / Please sign the document');
      return;
    }

    // Check balance logic
    if (leaveType === 'SICK' && user && user.sickLeaveBalance !== undefined && user.sickLeaveBalance < 1) {
      setError('โควตาลาป่วยของคุณหมดแล้ว / Your sick leave quota is exhausted');
      return;
    }
    if (leaveType === 'ANNUAL' && user && user.annualLeaveBalance !== undefined && user.annualLeaveBalance < 1) {
      setError('โควตาลาพักร้อนของคุณหมดแล้ว / Your annual leave quota is exhausted');
      return;
    }
    if (leaveType === 'COMPENSATORY' && user && user.tokensBalance < 1) {
      setError('โทเค็นสะสมของคุณไม่พอ / Insufficient compensatory tokens');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        leaveDate,
        leaveType,
        reason: reason.trim(),
        signature: finalSignature,
        attachment: attachment || undefined
      });
      // Reset form
      setLeaveDate('');
      setLeaveType('CASUAL');
      setReason('');
      setSignature('');
      setAttachment('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งเอกสาร');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-zinc-100 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">ยื่นเอกสารใบลางานรายวัน</h3>
            <p className="text-xs text-zinc-500">Create Leave Request Document</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{error}</span>
              </div>
            )}

            {/* Read-only User Profile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
              <div className="col-span-2">
                <span className="block text-zinc-500 font-medium">ชื่อผู้ขอลา / Name</span>
                <span className="font-bold text-zinc-900">{user?.name || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-zinc-500 font-medium">แผนก / Department</span>
                <span className="font-bold text-zinc-900">{user?.department || '-'}</span>
              </div>
              <div className="col-span-2 border-t border-zinc-100/60 pt-2">
                <span className="block text-zinc-500 font-medium">ตำแหน่ง / Title</span>
                <span className="font-bold text-zinc-900">{user?.title || '-'}</span>
              </div>
              <div className="border-t border-zinc-100/60 pt-2">
                <span className="block text-zinc-500 font-medium">โควตาลาป่วย / Sick</span>
                <span className="font-bold text-zinc-900">{user?.sickLeaveBalance ?? 30} วัน</span>
              </div>
              <div className="border-t border-zinc-100/60 pt-2">
                <span className="block text-zinc-500 font-medium">ลาพักร้อน / Annual</span>
                <span className="font-bold text-zinc-900">{user?.annualLeaveBalance ?? 6} วัน</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Leave Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  วันที่ต้องการลา / Leave Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm bg-white hover:bg-zinc-50/50 focus:border-zinc-900 transition-colors outline-none font-medium text-zinc-900"
                />
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  ประเภทการลา / Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-sm bg-white hover:bg-zinc-50/50 focus:border-zinc-900 transition-colors outline-none font-bold text-zinc-900"
                >
                  <option value="CASUAL">ลากิจ / Casual Leave</option>
                  <option value="SICK">ลาป่วย / Sick Leave</option>
                  <option value="ANNUAL">ลาพักร้อน / Annual Leave</option>
                  <option value="COMPENSATORY">ลาชดเชย (หัก 1 โทเค็น) / Compensatory Leave</option>
                </select>
                {leaveType === 'COMPENSATORY' && (
                  <p className="mt-1.5 text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    <span>ระบบจะหัก 1 โทเค็นสะสมของคุณโดยอัตโนมัติเมื่อได้รับการอนุมัติ (มีอยู่ {user?.tokensBalance || 0} โทเค็น)</span>
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  เหตุผลการลา / Reason for Leave <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลการลาอย่างละเอียด..."
                  className="w-full p-3 border border-zinc-200 rounded-xl text-sm bg-white hover:bg-zinc-50/50 focus:border-zinc-900 transition-colors outline-none font-medium text-zinc-900 resize-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  เอกสารแนบ / Attachment (เช่น ใบรับรองแพทย์ / Medical Certificate)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAttachment(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setAttachment('');
                    }
                  }}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                />
                {attachment && (
                  <div className="mt-2 relative w-32 h-20 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                    <img src={attachment} alt="Attachment Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachment('')}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 flex items-center justify-center cursor-pointer border-0 outline-none"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Signature Pad */}
              <div>
                <label className="text-xs font-bold text-zinc-700 mb-1.5 flex justify-between items-center">
                  <span>ลายมือชื่อผู้ขอลา / Applicant Signature <span className="text-red-500">*</span></span>
                  {user?.savedSignature && (
                    <button
                      type="button"
                      onClick={() => setUseSavedSignature(!useSavedSignature)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {useSavedSignature ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>ใช้ลายเซ็นที่บันทึกไว้ / Use saved signature</span>
                    </button>
                  )}
                </label>

                {useSavedSignature && user?.savedSignature ? (
                  <div className="h-36 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={user.savedSignature}
                      alt="Saved Signature"
                      className="max-h-full max-w-full object-contain filter invert"
                    />
                  </div>
                ) : (
                  <SignatureCanvas onChange={(base64) => setSignature(base64)} />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              ยกเลิก / Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>ส่งใบลา / Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
