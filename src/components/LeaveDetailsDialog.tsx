'use client';

import { useRef } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import type { LeaveFormData } from './LeaveFormDialog';

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

function parseFormData(reason?: string): LeaveFormData | null {
  if (!reason) return null;
  try {
    const data = JSON.parse(reason);
    if (data && typeof data === 'object' && data.leaveType) return data as LeaveFormData;
    return null;
  } catch { return null; }
}

function leaveLabel(type: string): string {
  const m: Record<string, string> = { SICK: 'ป่วย', PERSONAL: 'กิจส่วนตัว', MATERNITY: 'คลอดบุตร' };
  return m[type] || type;
}

function leaveIcon(type: string): string {
  const m: Record<string, string> = { SICK: 'medical_services', PERSONAL: 'work_off', MATERNITY: 'child_care' };
  return m[type] || 'event_busy';
}

function fmtDate(d: string): string {
  if (!d) return '...............';
  const thM = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const dt = new Date(d);
  return `${dt.getDate()} ${thM[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}

export function LeaveDetailsDialog({ open, onClose, leaveDate, userName, leaveRequest }: LeaveDetailsDialogProps) {
  const { language } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const fd = parseFormData(leaveRequest?.reason);
  const name = fd?.fullName || userName;
  const pos = fd?.position || '';
  const dept = fd?.department || '';
  const lt = fd?.leaveType || 'PERSONAL';
  const reason = fd?.reasonText || leaveRequest?.reason || '';
  const from = fd?.fromDate || leaveDate;
  const to = fd?.toDate || leaveDate;
  const days = fd?.totalDays || 1;
  const contact = fd?.contactAddress || '';
  const phone = fd?.contactPhone || '';
  const loc = fd?.writtenAt || '';
  const recipient = fd?.recipientTitle || '';

  const DotVal = ({ val, w = 120 }: { val: string; w?: number }) => (
    val
      ? <span style={{ minWidth: w, borderBottom: '1.5px dotted #8b9cb5', display: 'inline-block', padding: '0 4px', color: '#1e3a5f', fontWeight: 500 }}>{val}</span>
      : <span style={{ minWidth: w, borderBottom: '1.5px dotted #8b9cb5', display: 'inline-block' }}>&nbsp;</span>
  );

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>ใบลา - ${name}</title><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Sarabun',sans-serif; font-size:13px; color:#1e3a5f; padding:0; }
        .page { max-width:700px; margin:20px auto; border:1.5px solid #c5b99b; position:relative; }
        .gold-bar { height:6px; background:linear-gradient(90deg,#8b6914,#d4a843,#8b6914); }
        .content { padding:32px 40px; }
        .header { text-align:center; font-size:16px; font-weight:700; letter-spacing:2px; color:#1e3a5f; padding-bottom:12px; border-bottom:2.5px double #c5b99b; margin-bottom:20px; }
        .header small { display:block; font-size:9px; color:#8b9cb5; letter-spacing:3px; text-transform:uppercase; margin-top:4px; font-weight:600; }
        .row { margin-bottom:8px; line-height:2; }
        .label { font-weight:600; color:#1e3a5f; }
        .dot { border-bottom:1.5px dotted #8b9cb5; display:inline-block; min-width:100px; padding:0 4px; color:#1e3a5f; font-weight:500; }
        .section { background:#f8f6f0; border:1px solid #e8e2d0; border-radius:6px; padding:12px 16px; margin:12px 0; }
        .section-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b6914; margin-bottom:8px; }
        .leave-badges { display:flex; gap:12px; margin:8px 0; }
        .badge { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:6px; font-size:11px; font-weight:600; border:1.5px solid #d4c9a8; color:#6b7c8d; }
        .badge.active { background:#1e3a5f; color:white; border-color:#1e3a5f; }
        .date-section { background:#f0f4f8; border:1px solid #d0dbe6; border-radius:6px; padding:12px 16px; margin:12px 0; }
        .sig-area { text-align:right; padding-right:40px; margin-top:24px; }
        .sig-block { display:inline-flex; flex-direction:column; align-items:center; gap:4px; }
        .sig-name { font-size:18px; font-family:serif; font-style:italic; border-bottom:1.5px solid #1e3a5f; padding:2px 20px; color:#1e3a5f; }
        .sig-img { max-height:50px; }
        .sig-label { font-size:10px; color:#8b9cb5; }
        .attachment-img { max-width:280px; max-height:180px; border:1px solid #e8e2d0; border-radius:6px; margin:8px 0; }
        @media print { body{padding:0;} .page{border:none;margin:0;max-width:100%;} .gold-bar{print-color-adjust:exact;-webkit-print-color-adjust:exact;} .badge.active{background:#1e3a5f!important;color:white!important;print-color-adjust:exact;-webkit-print-color-adjust:exact;} }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-3">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[680px] max-h-[94vh] overflow-y-auto custom-scrollbar animate-fade-in">

        {/* ═══ Toolbar ═══ */}
        <div className="sticky top-0 z-10 bg-[#1e3a5f] text-white flex justify-between items-center px-5 py-2.5 rounded-t-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d4a843] text-lg">description</span>
            <span className="text-[13px] font-bold tracking-wide">
              {language === 'th' ? 'รายละเอียดใบลา' : 'Leave Document'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1 bg-white/15 hover:bg-white/25 rounded text-[11px] font-bold transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">print</span>
              พิมพ์ / PDF
            </button>
            <button onClick={onClose}
              className="p-1 rounded hover:bg-white/15 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* ═══ Document Body ═══ */}
        <div ref={printRef}>
          <div className="page bg-[#fffef8] border border-[#c5b99b] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
            style={{ fontFamily: "'Sarabun','Noto Sans Thai',sans-serif" }}>

            <div className="gold-bar h-1.5 bg-linear-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914]" />

            <div className="content px-8 md:px-10 py-7 space-y-4" style={{ lineHeight: 2, fontSize: 13 }}>

              {/* Header */}
              <div className="header text-center pb-3 border-b-[2.5px] border-double border-[#c5b99b] mb-5">
                <div className="flex items-center justify-center gap-2 text-[#1e3a5f]">
                  <span className="material-symbols-outlined text-[#8b6914] text-xl">description</span>
                  <span className="text-[16px] font-bold tracking-[0.15em]">แบบใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว</span>
                  <span className="material-symbols-outlined text-[#8b6914] text-xl">description</span>
                </div>
                <small className="text-[9px] text-[#8b9cb5] tracking-[3px] uppercase font-semibold mt-1 block">
                  Sick Leave / Maternity Leave / Personal Leave Form
                </small>
              </div>

              {/* เขียนที่ + วันที่ */}
              <div className="row flex flex-wrap items-end gap-x-2 text-[13px] text-[#3d4f5f]">
                <span className="label font-semibold text-[#1e3a5f]">เขียนที่</span>
                <DotVal val={loc} w={160} />
                <span className="ml-auto text-[12px] text-[#6b7c8d]">
                  วันที่ <DotVal val={fmtDate(fd?.formDate || leaveDate)} w={180} />
                </span>
              </div>

              {/* เรื่อง / เรียน */}
              <div className="row text-[13px] text-[#3d4f5f]">
                <span className="label font-semibold text-[#1e3a5f]">เรื่อง</span> ขออนุญาตลา
              </div>
              <div className="row flex items-end gap-2 text-[13px] text-[#3d4f5f]">
                <span className="label font-semibold text-[#1e3a5f]">เรียน</span>
                <DotVal val={recipient} w={340} />
              </div>

              {/* ข้อมูลผู้ยื่น */}
              <div className="section bg-[#f8f6f0] border border-[#e8e2d0] rounded-lg p-4 space-y-2">
                <div className="section-title text-[9px] font-bold uppercase tracking-[2px] text-[#8b6914] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">person</span>
                  ข้อมูลผู้ยื่นใบลา
                </div>
                <div className="flex flex-wrap items-end gap-x-4 gap-y-1 text-[13px] text-[#3d4f5f]">
                  <span><span className="label font-semibold text-[#1e3a5f]">ข้าพเจ้า</span> <DotVal val={name} w={180} /></span>
                  <span><span className="label font-semibold text-[#1e3a5f]">ตำแหน่ง</span> <DotVal val={pos} w={140} /></span>
                </div>
                <div className="text-[13px] text-[#3d4f5f]">
                  <span className="label font-semibold text-[#1e3a5f]">สังกัด</span> <DotVal val={dept} w={320} />
                </div>
              </div>

              {/* ประเภทการลา */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-[2px] text-[#8b6914] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">event_busy</span>
                  ประเภทการลา
                </div>
                <div className="leave-badges flex flex-wrap gap-2">
                  {(['SICK', 'PERSONAL', 'MATERNITY'] as const).map((type) => (
                    <span key={type}
                      className={`badge inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border ${
                        lt === type
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-[#8b9cb5] border-[#d4c9a8]'
                      }`}
                      style={lt === type ? { backgroundColor: '#1e3a5f', color: 'white' } : {}}>
                      <span className="material-symbols-outlined text-xs">{leaveIcon(type)}</span>
                      {leaveLabel(type)}
                    </span>
                  ))}
                </div>
              </div>

              {/* เนื่องจาก */}
              <div className="row text-[13px] text-[#3d4f5f]">
                <span className="label font-semibold text-[#1e3a5f]">เนื่องจาก</span>{' '}
                <DotVal val={reason} w={380} />
              </div>

              {/* กำหนดวันลา */}
              <div className="date-section bg-[#f0f4f8] border border-[#d0dbe6] rounded-lg p-4">
                <div className="text-[9px] font-bold uppercase tracking-[2px] text-[#1e3a5f] flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-xs">date_range</span>
                  กำหนดวันลา
                </div>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1 text-[13px] text-[#3d4f5f]">
                  <span><span className="label font-semibold text-[#1e3a5f]">ตั้งแต่</span> <DotVal val={fmtDate(from)} w={150} /></span>
                  <span className="text-[#8b9cb5]">→</span>
                  <span><span className="label font-semibold text-[#1e3a5f]">ถึง</span> <DotVal val={fmtDate(to)} w={150} /></span>
                  <span className="text-[#8b9cb5]">=</span>
                  <span className="font-bold text-[#1e3a5f]">{days} วัน</span>
                </div>
              </div>

              {/* ติดต่อ */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1 text-[13px] text-[#3d4f5f]">
                <span><span className="label font-semibold text-[#1e3a5f]">ติดต่อได้ที่</span> <DotVal val={contact} w={200} /></span>
                <span><span className="label font-semibold text-[#1e3a5f]">โทร</span> <DotVal val={phone} w={140} /></span>
              </div>

              {/* เอกสารแนบ */}
              {leaveRequest?.attachmentImage && (
                <div className="space-y-1">
                  <div className="text-[9px] font-bold uppercase tracking-[2px] text-[#8b6914] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">attach_file</span>
                    เอกสารแนบ
                  </div>
                  <div className="border border-[#e8e2d0] rounded-lg overflow-hidden bg-white inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={leaveRequest.attachmentImage} alt="Attachment"
                      className="attachment-img max-h-[180px] max-w-[280px] object-contain" />
                  </div>
                </div>
              )}

              {/* ลายเซ็น */}
              <div className="border-t-2 border-double border-[#c5b99b] pt-5">
                <div className="sig-area flex flex-col items-end pr-6 gap-1">
                  <span className="text-[12px] text-[#6b7c8d]">ขอแสดงความนับถือ</span>
                  <div className="sig-block flex flex-col items-center gap-1 mt-2">
                    {leaveRequest?.signatureType === 'DRAW' && leaveRequest.signatureImage ? (
                      <div className="h-12 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={leaveRequest.signatureImage} alt="Signature"
                          className="sig-img max-h-full object-contain" />
                      </div>
                    ) : (
                      <span className="sig-name text-xl font-serif italic border-b-[1.5px] border-[#1e3a5f] px-5 py-0.5 text-[#1e3a5f]">
                        {leaveRequest?.signatureText || name}
                      </span>
                    )}
                    <span className="sig-label text-[10px] text-[#8b9cb5]">(ลงชื่อ) {name}</span>
                    {pos && <span className="sig-label text-[10px] text-[#8b9cb5]">ตำแหน่ง {pos}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="gold-bar h-1 bg-linear-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914]" />
          </div>
        </div>

        {/* ═══ Bottom Actions ═══ */}
        <div className="sticky bottom-0 bg-[#1e3a5f] text-white flex justify-between items-center px-5 py-2.5 rounded-b-lg shadow-lg">
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#d4a843] hover:bg-[#c49835] text-[#1e3a5f] rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            บันทึก PDF / พิมพ์เอกสาร
          </button>
          <button onClick={onClose}
            className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-bold transition-colors cursor-pointer">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
