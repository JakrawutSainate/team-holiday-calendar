'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/src/components/AuthContext';

interface LeaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    date: string,
    reason: string,
    signatureType: 'DRAW' | 'TEXT',
    signatureText: string,
    signatureImage: string,
    attachmentImage: string
  ) => void;
  tokens: number;
  language: string;
  prefillDate?: string;
}

export interface LeaveFormData {
  writtenAt: string;
  formDate: string;
  recipientTitle: string;
  fullName: string;
  position: string;
  department: string;
  leaveType: 'SICK' | 'PERSONAL' | 'MATERNITY';
  reasonText: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  contactAddress: string;
  contactPhone: string;
}

export function LeaveFormDialog({ open, onClose, onSubmit, tokens, language, prefillDate }: LeaveFormDialogProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [writtenAt, setWrittenAt] = useState('');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [leaveType, setLeaveType] = useState<'SICK' | 'PERSONAL' | 'MATERNITY'>('SICK');
  const [reasonText, setReasonText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [signatureType, setSignatureType] = useState<'DRAW' | 'TEXT'>('TEXT');
  const [signatureText, setSignatureText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [attachmentImage, setAttachmentImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setFullName(user.name || '');
      setPosition(user.title || '');
      setDepartment(user.department || '');
      setSignatureText(user.name || '');
    }
    if (open && prefillDate) {
      setFromDate(prefillDate);
      setToDate(prefillDate);
    }
  }, [open, user, prefillDate]);

  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diff = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      setTotalDays(diff);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (open && signatureType === 'DRAW') {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }, 100);
    }
  }, [open, signatureType]);

  if (!open) return null;

  const handleClose = () => {
    setWrittenAt(''); setRecipientTitle(''); setFullName(''); setPosition('');
    setDepartment(''); setLeaveType('SICK'); setReasonText('');
    setFromDate(''); setToDate(''); setTotalDays(1);
    setContactAddress(''); setContactPhone('');
    setSignatureType('TEXT'); setSignatureText(''); setSignatureImage('');
    setAttachmentImage(''); setError('');
    onClose();
  };

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const c = getCoords(e);
    ctx.beginPath(); ctx.moveTo(c.x, c.y);
    setIsDrawing(true);
  };
  const doDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const c = getCoords(e);
    ctx.lineTo(c.x, c.y); ctx.stroke();
  };
  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current) setSignatureImage(canvasRef.current.toDataURL('image/png'));
    }
  };
  const clearDraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSignatureImage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachmentImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!fromDate) { setError(language === 'th' ? 'กรุณาระบุวันที่เริ่มลา' : 'Please specify start date'); return; }
    if (!fullName.trim()) { setError(language === 'th' ? 'กรุณาระบุชื่อ-สกุล' : 'Please specify name'); return; }
    if (signatureType === 'TEXT' && !signatureText.trim()) { setError(language === 'th' ? 'กรุณาพิมพ์ลายเซ็น' : 'Please type signature'); return; }
    if (signatureType === 'DRAW' && !signatureImage) { setError(language === 'th' ? 'กรุณาวาดลายเซ็น' : 'Please draw signature'); return; }

    const formData: LeaveFormData = {
      writtenAt, formDate: new Date().toISOString().slice(0, 10), recipientTitle,
      fullName, position, department, leaveType, reasonText,
      fromDate, toDate: toDate || fromDate, totalDays, contactAddress, contactPhone,
    };
    onSubmit(fromDate, JSON.stringify(formData), signatureType, signatureText, signatureImage, attachmentImage);
    handleClose();
  };

  const today = new Date();
  const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const todayLabel = language === 'th'
    ? `วันที่ ${today.getDate()} เดือน ${thaiMonths[today.getMonth()]} พ.ศ. ${today.getFullYear() + 543}`
    : today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  // Styled input that looks like underlined blank on official paper
  const fieldInput = "bg-transparent border-0 border-b-[1.5px] border-dashed border-[#8b9cb5] outline-none text-[13px] text-[#1e3a5f] font-medium px-1 py-0.5 placeholder:text-[#b0bec5] focus:border-[#1e3a5f] transition-colors";

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-3">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-[680px] max-h-[94vh] overflow-y-auto custom-scrollbar animate-fade-in">

        {/* ════ Official Document Paper ════ */}
        <div
          className="bg-[#fffef8] border border-[#c5b99b] shadow-[0_4px_24px_rgba(0,0,0,0.15)] mx-auto"
          style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}
        >
          {/* Gold header bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914]" />

          <div className="px-8 md:px-10 py-7 space-y-5">

            {/* ═══ Document Title ═══ */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-double border-[#c5b99b]">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#8b6914] text-2xl">description</span>
                <h2 className="text-[17px] font-bold text-[#1e3a5f] tracking-[0.15em]">
                  แบบใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว
                </h2>
                <span className="material-symbols-outlined text-[#8b6914] text-2xl">description</span>
              </div>
              <p className="text-[10px] text-[#8b9cb5] tracking-wider font-semibold uppercase">
                Sick Leave / Maternity Leave / Personal Leave Request Form
              </p>
            </div>

            {/* ═══ Token Badge ═══ */}
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#f0ebe0] text-[#8b6914] px-3 py-1 rounded-full border border-[#d4c9a8]">
                <span className="material-symbols-outlined text-xs">toll</span>
                {language === 'th' ? `โทเค็นคงเหลือ: ${tokens}` : `Balance: ${tokens} tokens`}
              </span>
            </div>

            {/* ═══ เขียนที่ + วันที่ ═══ */}
            <div className="grid grid-cols-2 gap-4 text-[13px] text-[#3d4f5f]">
              <div className="flex items-end gap-1.5">
                <span className="font-semibold text-[#1e3a5f] whitespace-nowrap">เขียนที่</span>
                <input value={writtenAt} onChange={(e) => setWrittenAt(e.target.value)}
                  placeholder="สถานที่..." className={`${fieldInput} flex-1`} />
              </div>
              <div className="text-right text-[12px] text-[#6b7c8d] self-end">{todayLabel}</div>
            </div>

            {/* ═══ เรื่อง / เรียน ═══ */}
            <div className="space-y-2 text-[13px] text-[#3d4f5f]">
              <div>
                <span className="font-semibold text-[#1e3a5f]">เรื่อง</span>
                <span className="ml-2 text-[#3d4f5f]">ขออนุญาตลา</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-semibold text-[#1e3a5f]">เรียน</span>
                <input value={recipientTitle} onChange={(e) => setRecipientTitle(e.target.value)}
                  placeholder="ผู้อำนวยการ / หัวหน้า..." className={`${fieldInput} flex-1`} />
              </div>
            </div>

            {/* ═══ ข้อมูลผู้ยื่นใบลา ═══ */}
            <div className="bg-[#f8f6f0] border border-[#e8e2d0] rounded-lg p-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b6914] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">person</span>
                ข้อมูลผู้ยื่นใบลา
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-[#3d4f5f]">
                <div className="flex items-end gap-1.5">
                  <span className="font-semibold text-[#1e3a5f] whitespace-nowrap text-[12px]">ข้าพเจ้า</span>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล" className={`${fieldInput} flex-1`} />
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="font-semibold text-[#1e3a5f] whitespace-nowrap text-[12px]">ตำแหน่ง</span>
                  <input value={position} onChange={(e) => setPosition(e.target.value)}
                    placeholder="ตำแหน่งงาน" className={`${fieldInput} flex-1`} />
                </div>
                <div className="col-span-2 flex items-end gap-1.5">
                  <span className="font-semibold text-[#1e3a5f] whitespace-nowrap text-[12px]">สังกัด</span>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)}
                    placeholder="แผนก / ฝ่าย / หน่วยงาน" className={`${fieldInput} flex-1`} />
                </div>
              </div>
            </div>

            {/* ═══ ประเภทการลา ═══ */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b6914] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">event_busy</span>
                ประเภทการลา
              </div>
              <div className="flex flex-wrap gap-3 pl-1">
                {(['SICK', 'PERSONAL', 'MATERNITY'] as const).map((type) => {
                  const labels: Record<string, string> = { SICK: 'ป่วย', PERSONAL: 'กิจส่วนตัว', MATERNITY: 'คลอดบุตร' };
                  const icons: Record<string, string> = { SICK: 'medical_services', PERSONAL: 'work_off', MATERNITY: 'child_care' };
                  const active = leaveType === type;
                  return (
                    <button key={type} type="button" onClick={() => setLeaveType(type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-md'
                          : 'bg-white text-[#3d4f5f] border-[#d4c9a8] hover:border-[#1e3a5f] hover:bg-[#f0f4f8]'
                      }`}>
                      <span className="material-symbols-outlined text-sm">{icons[type]}</span>
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ เหตุผล ═══ */}
            <div className="flex items-start gap-1.5 text-[13px] text-[#3d4f5f]">
              <span className="font-semibold text-[#1e3a5f] whitespace-nowrap pt-1">เนื่องจาก</span>
              <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={2}
                placeholder="ระบุเหตุผลในการลา..."
                className="flex-1 bg-transparent border border-dashed border-[#8b9cb5] rounded-md outline-none text-[13px] text-[#1e3a5f] font-medium px-2.5 py-1.5 placeholder:text-[#b0bec5] focus:border-[#1e3a5f] transition-colors resize-none" />
            </div>

            {/* ═══ กำหนดวันลา ═══ */}
            <div className="bg-[#f0f4f8] border border-[#d0dbe6] rounded-lg p-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">date_range</span>
                กำหนดวันลา
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-2 items-end text-[13px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#6b7c8d]">ตั้งแต่วันที่</span>
                  <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setError(''); }}
                    className={`${fieldInput} w-full`} />
                </div>
                <span className="text-[#8b9cb5] text-lg pb-0.5">→</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#6b7c8d]">ถึงวันที่</span>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                    className={`${fieldInput} w-full`} />
                </div>
                <span className="text-[#8b9cb5] pb-0.5">=</span>
                <div className="flex items-end gap-1">
                  <input type="number" min={1} value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))}
                    className={`${fieldInput} w-[40px] text-center font-bold`} />
                  <span className="text-[12px] text-[#6b7c8d] pb-0.5">วัน</span>
                </div>
              </div>
            </div>

            {/* ═══ ติดต่อระหว่างลา ═══ */}
            <div className="grid grid-cols-2 gap-4 text-[13px] text-[#3d4f5f]">
              <div className="flex items-end gap-1.5 col-span-2 md:col-span-1">
                <span className="font-semibold text-[#1e3a5f] whitespace-nowrap text-[12px]">ติดต่อได้ที่</span>
                <input value={contactAddress} onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="ที่อยู่ / สถานที่" className={`${fieldInput} flex-1`} />
              </div>
              <div className="flex items-end gap-1.5 col-span-2 md:col-span-1">
                <span className="font-semibold text-[#1e3a5f] whitespace-nowrap text-[12px]">โทรศัพท์</span>
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0xx-xxx-xxxx" className={`${fieldInput} flex-1`} />
              </div>
            </div>

            {/* ═══ เอกสารแนบ ═══ */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b6914] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">attach_file</span>
                เอกสารแนบ (ทางเลือก)
              </div>
              <div className="flex gap-3 items-center">
                <input type="file" accept="image/*" onChange={handleImageUpload} id="leave-img-up" className="hidden" />
                <label htmlFor="leave-img-up"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8b9cb5] text-[#3d4f5f] rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#f0f4f8] hover:border-[#1e3a5f] transition-all">
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  เลือกรูปภาพ
                </label>
                {attachmentImage && (
                  <div className="relative w-11 h-11 rounded-lg border border-[#d4c9a8] overflow-hidden bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachmentImage} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setAttachmentImage('')}
                      className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white cursor-pointer">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ ลายเซ็น ═══ */}
            <div className="border-t-2 border-double border-[#c5b99b] pt-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b6914] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">draw</span>
                  ลงชื่อผู้ยื่นใบลา
                </div>
                <div className="flex border border-[#d4c9a8] rounded-md p-0.5 text-[10px] bg-[#f8f6f0]">
                  <button type="button" onClick={() => { setSignatureType('TEXT'); setError(''); }}
                    className={`px-2.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      signatureType === 'TEXT' ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-[#6b7c8d] hover:text-[#1e3a5f]'
                    }`}>พิมพ์ชื่อ</button>
                  <button type="button" onClick={() => { setSignatureType('DRAW'); setError(''); }}
                    className={`px-2.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      signatureType === 'DRAW' ? 'bg-[#1e3a5f] text-white shadow-sm' : 'text-[#6b7c8d] hover:text-[#1e3a5f]'
                    }`}>เขียนลายเซ็น</button>
                </div>
              </div>

              {signatureType === 'TEXT' ? (
                <div className="flex flex-col items-center gap-1 py-3">
                  <input type="text" value={signatureText}
                    onChange={(e) => { setSignatureText(e.target.value); setError(''); }}
                    placeholder="พิมพ์ชื่อ-นามสกุล..."
                    className="w-full max-w-[280px] text-center px-4 py-2.5 border-b-2 border-[#1e3a5f] bg-transparent text-lg font-serif italic outline-none text-[#1e3a5f] placeholder:text-[#b0bec5]" />
                  <span className="text-[10px] text-[#8b9cb5] mt-1">(ลงชื่อ)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="relative border border-dashed border-[#8b9cb5] rounded-lg bg-[#fcfbf6] overflow-hidden">
                    <canvas ref={canvasRef} width={520} height={100}
                      onMouseDown={startDraw} onMouseMove={doDraw}
                      onMouseUp={endDraw} onMouseLeave={endDraw}
                      onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={endDraw}
                      className="w-full cursor-crosshair h-[100px]" />
                    <button type="button" onClick={clearDraw}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-white rounded border border-[#d4c9a8] text-[#6b7c8d] hover:text-[#1e3a5f] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-[#8b9cb5] text-center">เขียนลายเซ็นด้วยเมาส์หรือนิ้วสัมผัส</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[12px] text-red-600 font-semibold">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* ═══ Actions ═══ */}
            <div className="flex gap-3 justify-end pt-3 border-t border-[#e8e2d0]">
              <button onClick={handleClose}
                className="px-5 py-2 border border-[#d4c9a8] text-[#6b7c8d] rounded-lg text-[12px] font-semibold hover:bg-[#f8f6f0] transition-all cursor-pointer">
                ยกเลิก
              </button>
              <button onClick={handleSubmit}
                className="px-5 py-2 bg-[#1e3a5f] hover:bg-[#15304f] text-white rounded-lg text-[12px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">send</span>
                ยื่นใบลา
              </button>
            </div>
          </div>

          {/* Gold footer bar */}
          <div className="h-1 bg-gradient-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914]" />
        </div>
      </div>
    </div>
  );
}
