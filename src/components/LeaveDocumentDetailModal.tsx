'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';

interface LeaveDocument {
  id: string;
  userId: string;
  userName: string;
  department: string;
  title: string;
  leaveDate: string;
  leaveType: string;
  reason: string;
  signature: string;
  status: string;
  attachment?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

interface LeaveDocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LeaveDocument | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, rejectReason?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function LeaveDocumentDetailModal({
  isOpen,
  onClose,
  document,
  onApprove,
  onReject,
  onDelete
}: LeaveDocumentDetailModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !document) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.id === document.userId;
  const isPending = document.status === 'PENDING';

  const handleAction = async (actionFn: (id: string) => Promise<void>) => {
    try {
      setIsProcessing(true);
      setError('');
      await actionFn(document.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการทำรายการ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAction = async () => {
    if (!onReject) return;
    try {
      setIsProcessing(true);
      setError('');
      await onReject(document.id, rejectReason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    } finally {
      setIsProcessing(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'SICK': return 'ลาป่วย / Sick Leave';
      case 'CASUAL': return 'ลากิจ / Casual Leave';
      case 'ANNUAL': return 'ลาพักร้อน / Annual Leave';
      case 'COMPENSATORY': return 'ลาชดเชย / Compensatory Leave';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            อนุมัติแล้ว / Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            ไม่อนุมัติ / Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[14px]">pending</span>
            รออนุมัติ / Pending
          </span>
        );
    }
  };

  const formattedCreateDate = new Date(document.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-zinc-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">เอกสารใบลางานอย่างเป็นทางการ</h3>
            <p className="text-xs text-zinc-500">Official Leave Document Request</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>{error}</span>
            </div>
          )}

          {/* Document Status */}
          <div className="flex justify-between items-center bg-zinc-50/80 border border-zinc-100 rounded-xl p-4">
            <div>
              <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">สถานะเอกสาร / Status</span>
              <div className="mt-1">{getStatusBadge(document.status)}</div>
            </div>
            <div className="text-right text-[11px] text-zinc-500">
              <span className="block font-medium">ยื่นเมื่อ / Submitted on</span>
              <span className="font-semibold text-zinc-800">{formattedCreateDate}</span>
            </div>
          </div>

          {/* Reject Reason Display (If Rejected) */}
          {document.status === 'REJECTED' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">เหตุผลที่ปฏิเสธการลา / Rejection Reason</span>
              <p className="text-xs text-red-800 font-semibold">{document.rejectReason || 'ไม่ได้ระบุเหตุผล / No reason provided'}</p>
            </div>
          )}

          {/* Official Document Sheet Effect */}
          <div className="border border-zinc-200/80 rounded-2xl p-6 bg-white shadow-xs space-y-5 text-sm relative overflow-hidden">
            {/* Watermark/Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none select-none">
              <span className="material-symbols-outlined text-7xl text-zinc-300">description</span>
            </div>

            {/* Title Block */}
            <div className="text-center pb-4 border-b border-zinc-100">
              <h4 className="font-bold text-base text-zinc-950">ใบขออนุมัติลาหยุดงานรายวัน</h4>
              <p className="text-zinc-400 text-xs">HolidayHQ Leave Request Form</p>
            </div>

            {/* Applicant Details & Leave Details */}
            {(() => {
              let docName = document.userName;
              let docDept = document.department;
              let docTitle = document.title;
              let docReason = document.reason || '';

              if (docReason.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(docReason);
                  if (parsed && typeof parsed === 'object') {
                    if (parsed.fullName) docName = parsed.fullName;
                    if (parsed.department) docDept = parsed.department;
                    if (parsed.position) docTitle = parsed.position;
                    if (parsed.reasonText !== undefined) docReason = parsed.reasonText;
                    else if (parsed.reason !== undefined && !parsed.reason.trim().startsWith('{')) docReason = parsed.reason;
                    else docReason = '';
                  }
                } catch {}
              }

              return (
                <>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs border-b border-zinc-100 pb-4">
                    <div>
                      <span className="block text-zinc-400 font-medium">ชื่อพนักงาน / Name</span>
                      <span className="font-bold text-zinc-800">{docName}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-400 font-medium">แผนก / Department</span>
                      <span className="font-bold text-zinc-800">{docDept || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-zinc-400 font-medium">ตำแหน่ง / Title</span>
                      <span className="font-bold text-zinc-800">{docTitle || '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 border-b border-zinc-100 pb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-zinc-400 font-medium">วันที่ขอลา / Leave Date</span>
                        <span className="font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-800 w-fit block mt-1">
                          {new Date(document.leaveDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-400 font-medium">ประเภทการลา / Leave Type</span>
                        <span className="font-bold text-zinc-800 mt-1 block">{getLeaveTypeLabel(document.leaveType)}</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="block text-zinc-400 font-medium">เหตุผลการลา / Reason</span>
                      <p className="font-medium text-zinc-800 mt-1 bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
                        {docReason || '-'}
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Attachment Preview */}
            {document.attachment && (
              <div className="border-b border-zinc-100 pb-4 text-xs">
                <span className="block text-zinc-400 font-medium mb-1.5">เอกสารแนบ / Attachment</span>
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 max-h-48 flex items-center justify-center relative group">
                  <img src={document.attachment} alt="Attachment" className="max-h-48 max-w-full object-contain" />
                  <a
                    href={document.attachment}
                    download={`leave_attachment_${document.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer decoration-none"
                  >
                    <span className="material-symbols-outlined mr-1">open_in_new</span> ดูภาพใหญ่ / Open Full Image
                  </a>
                </div>
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-2 flex flex-col items-center text-center">
              <span className="text-zinc-400 text-xs font-medium mb-1">ลายมือชื่อผู้ขอลา / Signature</span>
              <div className="border border-zinc-100 rounded-xl bg-zinc-50/50 p-2 flex items-center justify-center h-20 w-48 relative">
                {document.signature ? (
                  <img
                    src={document.signature}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                  />
                ) : (
                  <span className="text-[10px] text-zinc-400">ไม่มีลายเซ็น / No signature</span>
                )}
              </div>
              <span className="font-bold text-zinc-700 text-xs mt-2">({document.userName})</span>
            </div>
          </div>

          {/* Reject Form Input (Admin Only) */}
          {showRejectForm && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-red-700">ระบุเหตุผลการปฏิเสธ / Reject Reason</label>
                <p className="text-[10px] text-red-500 mt-0.5">เหตุผลนี้จะถูกส่งไปให้ผู้ขอลารับทราบ / This will be visible to the user</p>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ข้อมูลเอกสารไม่ชัดเจน..."
                rows={2}
                className="w-full p-2.5 border border-red-200 rounded-xl text-xs bg-white text-zinc-900 outline-none focus:border-red-500 font-medium resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  ยกเลิก / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectAction}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  ยืนยันปฏิเสธ / Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          {/* Left action (Delete) */}
          <div>
            {onDelete && (isAdmin || (isOwner && isPending)) && !showRejectForm && (
              <button
                onClick={() => handleAction(onDelete)}
                disabled={isProcessing}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                ลบใบลา / Delete
              </button>
            )}
          </div>

          {/* Right actions (Close, Approve, Reject) */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              ปิด / Close
            </button>

            {isAdmin && isPending && onApprove && onReject && !showRejectForm && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  ปฏิเสธ / Reject
                </button>
                <button
                  onClick={() => handleAction(onApprove)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  อนุมัติ / Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
