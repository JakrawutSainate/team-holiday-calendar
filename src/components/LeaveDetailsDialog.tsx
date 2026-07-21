'use client';

import { useRef } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import type { LeaveFormData } from '@/src/types/leave';

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
  const stats = fd?.stats || null;

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
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(x => x.outerHTML)
      .join('\n');
    win.document.write(`<html><head><title>แบบใบลา - ${name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
      ${styles}
      <style>
        body { margin:0; padding:0; font-family:'Sarabun', 'Noto Sans Thai', sans-serif; background:#fff; color:#000; }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #fff !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            background: #fff !important;
            display: block !important;
          }
          .print-page > .page {
            height: 100% !important;
            min-height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            padding: 30px 40px !important;
          }
        }
      </style>
    </head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();

    const triggerPrint = () => {
      win.print();
      win.close();
    };

    if (win.document.readyState === 'complete') {
      setTimeout(triggerPrint, 500);
    } else {
      win.onload = () => setTimeout(triggerPrint, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-3">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[680px] max-h-[94vh] overflow-y-auto custom-scrollbar animate-fade-in">

        {/* ═══ Toolbar ═══ */}
        <div className="sticky top-0 z-10 bg-zinc-900 text-white flex justify-between items-center px-5 py-2.5 rounded-t-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d4a843] text-lg">description</span>
            <span className="text-[13px] font-bold tracking-wide">
              {language === 'th' ? 'รายละเอียดใบลา' : 'Leave Document'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] font-bold transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">print</span>
              พิมพ์ / PDF
            </button>
            <button onClick={onClose}
              className="p-1 rounded hover:bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* ═══ Document Body ═══ */}
        <div ref={printRef} className="print-page overflow-hidden border border-zinc-300 bg-white text-black leading-relaxed" style={{ fontSize: 13, color: '#000' }}>
          <div className="page p-8 md:p-10 space-y-6" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>

            {/* Header title */}
            <div className="text-center pb-2 border-b border-black mb-4">
              <h2 className="text-base font-bold text-black tracking-wide" style={{ fontSize: 16 }}>
                แบบใบลาป่วย ลากิจส่วนตัว ลาคลอดบุตร
              </h2>
            </div>

            {/* เขียนที่ + วันที่ */}
            <div className="flex flex-col items-end space-y-1.5 text-xs">
              <div className="flex items-end gap-1 w-full max-w-[280px]">
                <span className="whitespace-nowrap">(เขียนที่)</span>
                <span className="border-b border-dotted border-black flex-1 text-center font-bold min-h-[18px]">{loc || '..................................'}</span>
              </div>
              <div className="flex items-end gap-1 w-full max-w-[280px]">
                <span>วันที่</span>
                <span className="border-b border-dotted border-black w-10 text-center font-bold min-h-[18px]">{fd ? new Date(fd.formDate || leaveDate).getDate() : '......'}</span>
                <span>เดือน</span>
                <span className="border-b border-dotted border-black w-24 text-center font-bold min-h-[18px]">{fd ? ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][new Date(fd.formDate || leaveDate).getMonth()] : '..................'}</span>
                <span>พ.ศ.</span>
                <span className="border-b border-dotted border-black w-14 text-center font-bold min-h-[18px]">{fd ? new Date(fd.formDate || leaveDate).getFullYear() + 543 : '..........'}</span>
              </div>
            </div>

            {/* เรื่อง / เรียน */}
            <div className="space-y-1.5 text-xs">
              <div>
                <span className="font-bold">เรื่อง</span> ขออนุญาตลา
              </div>
              <div className="flex flex-wrap items-center gap-1 w-full">
                <span className="font-bold">เรียน</span>
                <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[200px]">{recipient || '......................................................................'}</span>
              </div>
            </div>

            {/* ข้อมูลผู้ลา */}
            <div className="text-xs space-y-4 leading-loose text-justify text-zinc-950">
              <div className="indent-8">
                ข้าพเจ้า <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[200px] text-center">{name || '......................................................................'}</span>
                ตำแหน่ง <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[150px] text-center">{pos || '....................................'}</span>
              </div>
              <div className="indent-8">
                สังกัด <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[200px] text-center">{dept || '......................................................................'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2">
                <span>ขอลา</span>
                <span className="inline-flex items-center gap-1.5 ml-4">
                  <input type="checkbox" checked={lt === 'SICK'} readOnly className="accent-black" />
                  <span>ป่วย</span>
                </span>
                <span className="inline-flex items-center gap-1.5 ml-4">
                  <input type="checkbox" checked={lt === 'PERSONAL'} readOnly className="accent-black" />
                  <span>กิจส่วนตัว</span>
                </span>
                <span className="inline-flex items-center gap-1.5 ml-4">
                  <input type="checkbox" checked={lt === 'MATERNITY'} readOnly className="accent-black" />
                  <span>คลอดบุตร</span>
                </span>
              </div>

              <div className="flex items-end w-full gap-2">
                <span>เนื่องจาก</span>
                <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[250px]">{reason || '................................................................................................'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                <span>ตั้งแต่วันที่</span>
                <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[130px]">{fmtDate(from)}</span>
                <span>ถึงวันที่</span>
                <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[130px]">{fmtDate(to)}</span>
                <span>มีกำหนด</span>
                <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[40px]">{days}</span>
                <span>วัน</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 w-full">
                <span>ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่</span>
                <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[300px]">{contact || '................................................................................................................'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 w-full">
                <span>หมายเลขโทรศัพท์</span>
                <span className="border-b border-dotted border-black px-2 font-bold inline-block min-w-[180px]">{phone || '....................................'}</span>
              </div>
            </div>

            {/* ขอแสดงความนับถือ */}
            <div className="flex flex-col items-end pr-8 text-xs space-y-1 mt-4">
              <div className="flex flex-col items-center space-y-1">
                <span>ขอแสดงความนับถือ</span>
                <div className="h-10 flex items-center justify-center py-1">
                  {leaveRequest?.signatureType === 'DRAW' && leaveRequest.signatureImage ? (
                    <img src={leaveRequest.signatureImage} alt="Signature" className="max-h-full object-contain" />
                  ) : (
                    <span className="font-serif italic border-b border-black px-4 min-h-[18px]">{leaveRequest?.signatureText || name || '....................................'}</span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span>(ลงชื่อ)</span>
                  <span className="border-b border-dotted border-black w-[150px] text-center min-h-[16px]">{name || '....................................'}</span>
                </div>
                <div className="flex items-end gap-1">
                  <span>(ตัวบรรจง)</span>
                  <span className="border-b border-dotted border-black w-[150px] text-center min-h-[16px]">{name || '....................................'}</span>
                </div>
              </div>
            </div>

            {/* Bottom layout split: stats (left) and supervisor/order (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-black pt-4 text-xs">
              
              {/* Left: Stats table and inspector sign */}
              <div className="space-y-4 pr-0 md:pr-4 border-r-0 md:border-r border-zinc-200">
                <div className="font-bold text-black text-[10px] tracking-wide uppercase">
                  สถิติการลาในปีงบประมาณนี้
                </div>
                <table className="w-full text-center border-collapse text-[11px] border border-black" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-zinc-50 font-bold">
                      <th className="border border-black p-1 text-left">ประเภทลา</th>
                      <th className="border border-black p-1 w-20">ลามาแล้ว</th>
                      <th className="border border-black p-1 w-16">ลาครั้งนี้</th>
                      <th className="border border-black p-1 w-16">รวมเป็น</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 text-left font-bold">ป่วย</td>
                      <td className="border border-black p-1">{stats?.sick?.taken ?? '-'}</td>
                      <td className="border border-black p-1">{stats?.sick?.current ?? (lt === 'SICK' ? days : 0)}</td>
                      <td className="border border-black p-1 font-bold">{stats?.sick?.total ?? (stats?.sick?.taken !== undefined ? stats.sick.taken + (lt === 'SICK' ? days : 0) : '-')}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 text-left font-bold">กิจส่วนตัว</td>
                      <td className="border border-black p-1">{stats?.personal?.taken ?? '-'}</td>
                      <td className="border border-black p-1">{stats?.personal?.current ?? (lt === 'PERSONAL' ? days : 0)}</td>
                      <td className="border border-black p-1 font-bold">{stats?.personal?.total ?? (stats?.personal?.taken !== undefined ? stats.personal.taken + (lt === 'PERSONAL' ? days : 0) : '-')}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 text-left font-bold">คลอดบุตร</td>
                      <td className="border border-black p-1">{stats?.maternity?.taken ?? '-'}</td>
                      <td className="border border-black p-1">{stats?.maternity?.current ?? (lt === 'MATERNITY' ? days : 0)}</td>
                      <td className="border border-black p-1 font-bold">{stats?.maternity?.total ?? (stats?.maternity?.taken !== undefined ? stats.maternity.taken + (lt === 'MATERNITY' ? days : 0) : '-')}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-end gap-1">
                    <span>(ลงชื่อ)</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                    <span>ผู้ตรวจสอบ</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>ตำแหน่ง</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>วันที่</span>
                    <span className="border-b border-dotted border-black w-8 min-h-[16px]"></span>
                    <span>เดือน</span>
                    <span className="border-b border-dotted border-black w-20 min-h-[16px]"></span>
                    <span>พ.ศ.</span>
                    <span className="border-b border-dotted border-black w-10 min-h-[16px]"></span>
                  </div>
                </div>
              </div>

              {/* Right: Supervisor comment and Order */}
              <div className="space-y-4 pl-0 md:pl-2">
                {/* Supervisor Comment */}
                <div className="space-y-2">
                  <div className="font-bold text-black text-[10px] tracking-wide uppercase">
                    ความเห็นของผู้บังคับบัญชา
                  </div>
                  <div className="border-b border-dotted border-black w-full min-h-[16px]"></div>
                  <div className="border-b border-dotted border-black w-full min-h-[16px]"></div>
                  <div className="flex items-end gap-1 pt-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>ตำแหน่ง</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>วันที่</span>
                    <span className="border-b border-dotted border-black w-8 min-h-[16px]"></span>
                    <span>เดือน</span>
                    <span className="border-b border-dotted border-black w-20 min-h-[16px]"></span>
                    <span>พ.ศ.</span>
                    <span className="border-b border-dotted border-black w-10 min-h-[16px]"></span>
                  </div>
                </div>

                {/* Order */}
                <div className="space-y-2 border-t border-dotted border-zinc-300 pt-3">
                  <div className="font-bold text-black text-[10px] tracking-wide uppercase">
                    คำสั่ง
                  </div>
                  <div className="flex gap-4">
                    <span>[ ] อนุญาต</span>
                    <span>[ ] ไม่อนุญาต</span>
                  </div>
                  <div className="flex items-end gap-1 pt-1.5">
                    <span>(ลงชื่อ)</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>ตำแหน่ง</span>
                    <span className="border-b border-dotted border-black flex-1 min-h-[16px]"></span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span>วันที่</span>
                    <span className="border-b border-dotted border-black w-8 min-h-[16px]"></span>
                    <span>เดือน</span>
                    <span className="border-b border-dotted border-black w-20 min-h-[16px]"></span>
                    <span>พ.ศ.</span>
                    <span className="border-b border-dotted border-black w-10 min-h-[16px]"></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Attachment preview if exists */}
            {leaveRequest?.attachmentImage && (
              <div className="space-y-1 border-t border-dotted border-zinc-300 pt-4">
                <div className="font-bold text-black text-[10px] tracking-wide uppercase">
                  เอกสารแนบ / Attachment
                </div>
                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white inline-block">
                  <img src={leaveRequest.attachmentImage} alt="Attachment"
                    className="max-h-[180px] max-w-[280px] object-contain" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ═══ Bottom Actions ═══ */}
        <div className="sticky bottom-0 bg-zinc-900 text-white flex justify-between items-center px-5 py-2.5 rounded-b-lg shadow-lg">
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#d4a843] hover:bg-[#c49835] text-[#1e3a5f] rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            บันทึก PDF / พิมพ์เอกสาร
          </button>
          <button onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
