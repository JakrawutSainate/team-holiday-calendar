'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/src/components/AuthContext';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { LeaveRequestController } from './LeaveRequestController';
import { LeaveRequestValidator } from '../schema';
import { LeaveFormData, LeaveStats } from '@/src/types/leave';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

export default function LeaveRequestClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const dateParam = searchParams.get('date') || '';

  const [, setTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Form states
  const [writtenAt, setWrittenAt] = useState('กรุงเทพมหานคร');
  const [recipientTitle, setRecipientTitle] = useState('หัวหน้างาน');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [leaveType, setLeaveType] = useState<'SICK' | 'PERSONAL' | 'MATERNITY'>('SICK');
  const [reasonText, setReasonText] = useState('');
  const [fromDate, setFromDate] = useState(dateParam);
  const [toDate, setToDate] = useState(dateParam);
  const [totalDays, setTotalDays] = useState(1);
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [signatureType, setSignatureType] = useState<'DRAW' | 'TEXT'>('TEXT');
  const [signatureText, setSignatureText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [attachmentImage, setAttachmentImage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manual Stats Overrides state
  const [sickTakenOverride, setSickTakenOverride] = useState<number | null>(null);
  const [personalTakenOverride, setPersonalTakenOverride] = useState<number | null>(null);
  const [maternityTakenOverride, setMaternityTakenOverride] = useState<number | null>(null);

  const [controller] = useState<LeaveRequestController>(
    () => new LeaveRequestController(user?.id || '', () => setTick((tick) => tick + 1))
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error(
        language === 'th' ? 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' : 'Please sign in first'
      );
      router.push('/calendar?triggerLogin=true');
    }
  }, [user, authLoading, router, language]);

  // Load controller state (to get tokens and past leaves)
  useEffect(() => {
    if (user?.id) {
      controller.updateParams(user.id);
      controller.loadState();
    }
  }, [user?.id, controller]);

  // Prefill user data on load
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPosition(user.title || '');
      setDepartment(user.department || '');
      setSignatureText(user.name || '');
    }
  }, [user]);

  // Auto-calculate duration days
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (to >= from) {
        const diff = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        setTotalDays(diff);
      } else {
        setTotalDays(1);
      }
    }
  }, [fromDate, toDate]);

  // Canvas drawing handlers
  useEffect(() => {
    if (signatureType === 'DRAW') {
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
  }, [signatureType]);

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

  // Calculate past leave days based on state (and apply manual overrides if any)
  const currentYear = new Date(fromDate || new Date()).getFullYear();
  const calculatedStats = controller.calculatePastLeaveDays(currentYear);

  const sickTaken = sickTakenOverride !== null ? sickTakenOverride : calculatedStats.SICK;
  const personalTaken = personalTakenOverride !== null ? personalTakenOverride : calculatedStats.PERSONAL;
  const maternityTaken = maternityTakenOverride !== null ? maternityTakenOverride : calculatedStats.MATERNITY;

  const currentSick = leaveType === 'SICK' ? totalDays : 0;
  const currentPersonal = leaveType === 'PERSONAL' ? totalDays : 0;
  const currentMaternity = leaveType === 'MATERNITY' ? totalDays : 0;

  const sickTotal = sickTaken + currentSick;
  const personalTotal = personalTaken + currentPersonal;
  const maternityTotal = maternityTaken + currentMaternity;

  const statsObj = {
    sick: { taken: sickTaken, current: currentSick, total: sickTotal },
    personal: { taken: personalTaken, current: currentPersonal, total: personalTotal },
    maternity: { taken: maternityTaken, current: currentMaternity, total: maternityTotal },
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = LeaveRequestValidator.validate({
      fromDate,
      fullName,
      signatureType,
      signatureText,
      signatureImage
    }, language);

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (controller.getTokens() < 1) {
      const msg = language === 'th' ? 'โทเค็นไม่เพียงพอ' : 'Insufficient Tokens';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      const formData: LeaveFormData = {
        writtenAt,
        formDate: new Date().toISOString().slice(0, 10),
        recipientTitle,
        fullName,
        position,
        level,
        department,
        leaveType,
        reasonText,
        fromDate,
        toDate: toDate || fromDate,
        totalDays,
        contactAddress,
        contactPhone,
        stats: statsObj,
      };

      await controller.submitLeave(
        fromDate,
        JSON.stringify(formData),
        signatureType,
        signatureText,
        signatureImage,
        attachmentImage
      );

      toast.success(
        language === 'th' ? 'ยื่นใบลาสำเร็จ' : 'Leave Requested',
        { description: language === 'th' ? 'หัก 1 โทเค็นและลงทะเบียนวันลาเรียบร้อยแล้ว' : 'Deducted 1 token and registered leave!' }
      );
      router.push('/calendar');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการยื่นใบลา' : 'Failed to request leave');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Printing logic
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>แบบใบลา - ${fullName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { margin:0; padding:20px; font-family:'Sarabun', 'Noto Sans Thai', sans-serif; background:#fff; }
        .page { background:#fff; width:100%; max-width:800px; margin:0 auto; padding:0; box-sizing:border-box; color:#3d4f5f; }
        .gold-bar { display:none; }
        .header { text-align:center; border-bottom:2px double #c5b99b; padding-bottom:12px; margin-bottom:20px; }
        .header h2 { font-size:18px; font-weight:bold; color:#1e3a5f; margin:0; tracking:0.1em; }
        .header p { font-size:9px; color:#8b9cb5; margin:4px 0 0 0; text-transform:uppercase; font-weight:bold; }
        .row { display:flex; flex-wrap:wrap; align-items:end; margin-bottom:10px; font-size:13px; }
        .label { font-weight:600; color:#1e3a5f; margin-right:6px; }
        .dot-val { border-bottom:1px dotted #8b9cb5; padding:0 8px; font-weight:500; color:#1e3a5f; display:inline-block; }
        .section { background:#f8f6f0; border:1px solid #e8e2d0; border-radius:8px; padding:16px; margin:16px 0; }
        .section-title { font-size:10px; font-weight:bold; text-transform:uppercase; color:#8b6914; display:flex; align-items:center; gap:6px; margin-bottom:8px; }
        .leave-badges { display:flex; gap:8px; margin-top:8px; }
        .badge { border:1px solid #d4c9a8; border-radius:4px; padding:4px 10px; font-size:11px; font-weight:600; color:#8b9cb5; display:inline-flex; align-items:center; gap:4px; background:#fff; }
        .badge.active { background:#1e3a5f; color:#fff; border-color:#1e3a5f; }
        .date-section { background:#f0f4f8; border:1px solid #d0dbe6; border-radius:6px; padding:12px 16px; margin:12px 0; }
        .sig-area { text-align:right; padding-right:40px; margin-top:24px; display:flex; flex-direction:column; align-items:end; }
        .sig-block { display:inline-flex; flex-direction:column; align-items:center; gap:4px; }
        .sig-name { font-size:18px; font-family:serif; font-style:italic; border-bottom:1.5px solid #1e3a5f; padding:2px 20px; color:#1e3a5f; }
        .sig-img { max-height:50px; }
        .sig-label { font-size:10px; color:#8b9cb5; }
        .attachment-img { max-width:280px; max-height:180px; border:1px solid #e8e2d0; border-radius:6px; margin:8px 0; }
        table.stats-table { width:100%; border-collapse:collapse; margin-top:15px; font-size:12px; }
        table.stats-table th, table.stats-table td { border:1px solid #c5b99b; padding:6px 10px; text-align:center; }
        table.stats-table th { background:#f8f6f0; color:#1e3a5f; font-weight:bold; }
        table.stats-table td.type-col { text-align:left; font-weight:bold; color:#1e3a5f; }
        @media print { body{padding:0;} .page{border:none;margin:0;max-width:100%;} }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const today = new Date();
  const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const todayLabel = language === 'th'
    ? `วันที่ ${today.getDate()} เดือน ${thaiMonths[today.getMonth()]} พ.ศ. ${today.getFullYear() + 543}`
    : today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateLabel = (dStr: string) => {
    if (!dStr) return '...............';
    const d = new Date(dStr);
    if (language === 'th') {
      return `${d.getDate()} ${thaiMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    }
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (authLoading || (controller.isLoading() && controller.getMembers().length === 0)) {
    return (
      <div className="grow flex flex-col min-h-screen lg:ml-64 p-12 justify-center items-center bg-background">
        <span className="animate-pulse text-lg font-medium text-zinc-500">
          กำลังโหลดแบบฟอร์มใบลา... / Loading Leave Form...
        </span>
      </div>
    );
  }

  // Field input class
  const inputClass = "w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-900 transition-colors";
  const labelClass = "text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block";

  return (
    <ErrorBoundary>
      <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcf9]">
        <TopNavBar placeholder={language === 'th' ? 'ยื่นวันลาพักร้อน / ชดเชย' : 'Submit compensatory leaves'} />

        <main className="flex-1 p-6 lg:p-10 pb-24 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <div>
                <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {language === 'th' ? 'ยื่นแบบใบลาพักผ่อน' : 'New Leave Request'}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {language === 'th' ? 'กรอกรายละเอียดและตรวจสอบความถูกต้องของลายเซ็นตามจริงด้านล่าง' : 'Fill in the form on the left and preview the official document on the right.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#fcf4e0] text-[#8b6914] px-4 py-2 rounded-xl border border-[#ebd8ad]">
                  <span className="material-symbols-outlined text-sm">toll</span>
                  {language === 'th' ? `โทเค็นคงเหลือ: ${controller.getTokens()}` : `Balance: ${controller.getTokens()} tokens`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* ════ LEFT COLUMN: INPUT FORM ════ */}
              <div className="bg-white border border-zinc-100 shadow-xs rounded-2xl p-6 space-y-6">
                
                <h3 className="text-lg font-bold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-500">edit_note</span>
                  {language === 'th' ? 'ข้อมูลใบลา' : 'Leave Information'}
                </h3>

                {/* เขียนที่ + เรียน */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>เขียนที่ / Written At</label>
                    <input value={writtenAt} onChange={(e) => setWrittenAt(e.target.value)}
                      placeholder="เช่น กรุงเทพมหานคร" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>เรียน / To</label>
                    <input value={recipientTitle} onChange={(e) => setRecipientTitle(e.target.value)}
                      placeholder="เช่น ผู้อำนวยการ / หัวหน้างาน" className={inputClass} />
                  </div>
                </div>

                {/* ข้อมูลผู้ลา (ข้าพเจ้า, ตำแหน่ง, ระดับ, สังกัด) */}
                <div className="bg-zinc-50 rounded-xl p-4 space-y-4">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-200/50 pb-2 mb-2">
                    <span className="material-symbols-outlined text-xs">person</span>
                    ข้อมูลผู้ลา (Master Data)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>ข้าพเจ้า / Name</label>
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>ตำแหน่ง / Position</label>
                      <input value={position} onChange={(e) => setPosition(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>ระดับ / Level</label>
                      <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="เช่น ระดับ 1, C3" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>สังกัด / Department</label>
                      <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* ประเภทการลา */}
                <div>
                  <label className={labelClass}>ประเภทการลา / Leave Type</label>
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    {(['SICK', 'PERSONAL', 'MATERNITY'] as const).map((type) => {
                      const labels = { SICK: 'ป่วย', PERSONAL: 'กิจส่วนตัว', MATERNITY: 'ลาคลอด' };
                      const icons = { SICK: 'medical_services', PERSONAL: 'work_off', MATERNITY: 'child_care' };
                      const active = leaveType === type;
                      return (
                        <button key={type} type="button" onClick={() => setLeaveType(type)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900'
                          }`}>
                          <span className="material-symbols-outlined text-sm">{icons[type]}</span>
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* เนื่องจาก (เหตุผล) */}
                <div>
                  <label className={labelClass}>เนื่องจาก (เหตุผลการลา) / Reason</label>
                  <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={3}
                    placeholder="ระบุเหตุผลในการลาหยุด..." className={`${inputClass} resize-none`} />
                </div>

                {/* กำหนดวันลา */}
                <div className="bg-[#f2f6fa] rounded-xl p-4 border border-blue-50/50">
                  <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-xs text-[#1e3a5f]">date_range</span>
                    กำหนดวันลา
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 mb-1 block">ตั้งแต่วันที่ / Start Date</label>
                      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 mb-1 block">ถึงวันที่ / End Date</label>
                      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 mb-1 block">รวม / Duration</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))}
                          className={`${inputClass} text-center font-bold text-[#1e3a5f] w-20`} />
                        <span className="text-xs font-bold text-zinc-500">วัน / Days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ติดต่อระหว่างลา */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>ติดต่อได้ที่ / Contact Address</label>
                    <input value={contactAddress} onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="ที่อยู่ระหว่างลา..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>เบอร์โทรศัพท์ / Phone Number</label>
                    <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0xx-xxx-xxxx" className={inputClass} />
                  </div>
                </div>

                {/* ตารางสถิติลา (แก้ไขปรับปรุงแมนนวลได้) */}
                <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">table_chart</span>
                      ตารางสถิติการลาในปีงบประมาณนี้
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold lowercase italic">
                      * สามารถกรอกแก้ไขตัวเลขสถิติลาสะสมได้
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-zinc-600 border-collapse">
                      <thead>
                        <tr className="bg-zinc-50">
                          <th className="border border-zinc-200 px-2 py-2 text-left font-semibold text-zinc-700">ประเภทลา</th>
                          <th className="border border-zinc-200 px-2 py-2 text-center font-semibold text-zinc-700 w-24">ลามาแล้ว (วัน)</th>
                          <th className="border border-zinc-200 px-2 py-2 text-center font-semibold text-zinc-700 w-20">ลาครั้งนี้</th>
                          <th className="border border-zinc-200 px-2 py-2 text-center font-semibold text-zinc-700 w-20">รวมเป็น</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-zinc-200 px-2 py-1.5 font-bold text-[#1e3a5f]">ป่วย / Sick</td>
                          <td className="border border-zinc-200 px-2 py-1 text-center">
                            <input type="number" min={0} value={sickTaken}
                              onChange={(e) => setSickTakenOverride(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-16 text-center border border-zinc-200 rounded py-0.5 bg-zinc-50/50" />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentSick}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{sickTotal}</td>
                        </tr>
                        <tr>
                          <td className="border border-zinc-200 px-2 py-1.5 font-bold text-[#1e3a5f]">กิจส่วนตัว / Personal</td>
                          <td className="border border-zinc-200 px-2 py-1 text-center">
                            <input type="number" min={0} value={personalTaken}
                              onChange={(e) => setPersonalTakenOverride(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-16 text-center border border-zinc-200 rounded py-0.5 bg-zinc-50/50" />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentPersonal}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{personalTotal}</td>
                        </tr>
                        <tr>
                          <td className="border border-zinc-200 px-2 py-1.5 font-bold text-[#1e3a5f]">คลอดบุตร / Maternity</td>
                          <td className="border border-zinc-200 px-2 py-1 text-center">
                            <input type="number" min={0} value={maternityTaken}
                              onChange={(e) => setMaternityTakenOverride(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-16 text-center border border-zinc-200 rounded py-0.5 bg-zinc-50/50" />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentMaternity}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{maternityTotal}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* เอกสารแนบ */}
                <div>
                  <label className={labelClass}>เอกสารแนบ (ทางเลือก) / Attachment</label>
                  <div className="flex gap-4 items-center mt-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} id="leave-img-up-request" className="hidden" />
                    <label htmlFor="leave-img-up-request"
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-300 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-zinc-50 transition-all">
                      <span className="material-symbols-outlined text-sm">cloud_upload</span>
                      เลือกรูปภาพ / Choose Image
                    </label>
                    {attachmentImage && (
                      <div className="relative w-12 h-12 rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-xs">
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

                {/* ลงลายเซ็น */}
                <div className="border-t border-zinc-100 pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={labelClass}>ลงชื่อผู้ยื่นใบลา / Signature</label>
                    <div className="flex border border-zinc-200 rounded-lg p-0.5 text-[10px] bg-zinc-50">
                      <button type="button" onClick={() => { setSignatureType('TEXT'); setError(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          signatureType === 'TEXT' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                        }`}>พิมพ์ชื่อ / Type Name</button>
                      <button type="button" onClick={() => { setSignatureType('DRAW'); setError(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          signatureType === 'DRAW' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                        }`}>วาดลายเซ็น / Draw</button>
                    </div>
                  </div>

                  {signatureType === 'TEXT' ? (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <input type="text" value={signatureText}
                        onChange={(e) => { setSignatureText(e.target.value); setError(''); }}
                        placeholder="พิมพ์ชื่อ-นามสกุล..."
                        className="w-full max-w-[320px] text-center px-4 py-2 border-b-2 border-zinc-800 bg-transparent text-xl font-serif italic outline-none text-[#1e3a5f] placeholder:text-zinc-300" />
                      <span className="text-[10px] text-zinc-400 mt-1">(ลงชื่อ)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="relative border border-dashed border-zinc-300 rounded-xl bg-zinc-50 overflow-hidden">
                        <canvas ref={canvasRef} width={520} height={100}
                          onMouseDown={startDraw} onMouseMove={doDraw}
                          onMouseUp={endDraw} onMouseLeave={endDraw}
                          onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={endDraw}
                          className="w-full cursor-crosshair h-[100px]" />
                        <button type="button" onClick={clearDraw}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-400 text-center">เขียนลายเซ็นด้วยเมาส์หรือนิ้วสัมผัส</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-xs text-red-600 font-semibold">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
                  <button onClick={() => router.push('/calendar')} disabled={submitting}
                    className="px-5 py-2.5 border border-zinc-200 text-zinc-500 rounded-xl text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50 transition-all cursor-pointer">
                    ยกเลิก / Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5">
                    {submitting ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        ยื่นใบลา / Submit Leave
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* ════ RIGHT COLUMN: LIVE PREVIEW ════ */}
              <div className="sticky top-6 space-y-4">
                <div className="flex justify-between items-center bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-xs">
                  <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#8b6914] text-sm">visibility</span>
                    เอกสารใบลาจำลอง (Live Document Preview)
                  </span>
                  <button onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#d4a843] hover:bg-[#c49835] text-[#1e3a5f] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs">
                    <span className="material-symbols-outlined text-sm">print</span>
                    พิมพ์ / PDF (Print)
                  </button>
                </div>

                {/* ═══ Document Frame ═══ */}
                <div ref={printRef} className="overflow-hidden rounded-2xl border border-[#c5b99b] shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-[#fffef8]">
                  <div className="page p-8 md:p-10 space-y-5" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
                    
                    {/* Gold header bar */}
                    <div className="gold-bar h-1.5 bg-linear-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914] -mx-10 -mt-10 mb-6" />

                    {/* Header title */}
                    <div className="header text-center pb-3 border-b-2 border-double border-[#c5b99b] mb-4">
                      <h2 className="text-base font-bold text-[#1e3a5f] tracking-widest">
                        แบบใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว
                      </h2>
                      <p className="text-[9px] text-[#8b9cb5] tracking-wider uppercase font-semibold">
                        Sick Leave / Maternity Leave / Personal Leave Request Form
                      </p>
                    </div>

                    {/* เขียนที่ + วันที่ */}
                    <div className="row flex justify-between items-end text-xs text-[#3d4f5f]">
                      <div className="flex items-end gap-1">
                        <span className="font-semibold text-[#1e3a5f]">เขียนที่</span>
                        <span className="dot-val min-w-[120px]">{writtenAt || '...............'}</span>
                      </div>
                      <div className="text-right text-[11px] text-[#6b7c8d]">
                        {todayLabel}
                      </div>
                    </div>

                    {/* เรื่อง / เรียน */}
                    <div className="space-y-2 text-xs text-[#3d4f5f]">
                      <div>
                        <span className="font-semibold text-[#1e3a5f]">เรื่อง</span>
                        <span className="ml-2 text-zinc-700">ขออนุญาตลา</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="font-semibold text-[#1e3a5f]">เรียน</span>
                        <span className="dot-val min-w-[200px]">{recipientTitle || '...............'}</span>
                      </div>
                    </div>

                    {/* ข้อมูลผู้ลา */}
                    <div className="section bg-[#f8f6f0] border border-[#e8e2d0] rounded-lg p-4 space-y-2.5 text-xs">
                      <div className="section-title text-[9px] font-bold uppercase tracking-widest text-[#8b6914] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        ข้อมูลผู้ยื่นใบลา
                      </div>
                      <div className="flex flex-wrap items-end gap-x-4 gap-y-1 text-[#3d4f5f]">
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">ข้าพเจ้า</span>
                          <span className="dot-val min-w-[150px]">{fullName || '...............'}</span>
                        </span>
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">ตำแหน่ง</span>
                          <span className="dot-val min-w-[120px]">{position || '...............'}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-end gap-x-4 gap-y-1 text-[#3d4f5f]">
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">ระดับ</span>
                          <span className="dot-val min-w-[80px]">{level || '...............'}</span>
                        </span>
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">สังกัด</span>
                          <span className="dot-val min-w-[200px]">{department || '...............'}</span>
                        </span>
                      </div>
                    </div>

                    {/* ประเภทการลา */}
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-[#1e3a5f] uppercase tracking-widest text-[9px] text-[#8b6914] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">event_busy</span>
                        ประเภทการลา
                      </div>
                      <div className="leave-badges flex gap-2">
                        {(['SICK', 'PERSONAL', 'MATERNITY'] as const).map((type) => {
                          const labels = { SICK: 'ป่วย', PERSONAL: 'กิจส่วนตัว', MATERNITY: 'คลอดบุตร' };
                          const icons = { SICK: 'medical_services', PERSONAL: 'work_off', MATERNITY: 'child_care' };
                          const active = leaveType === type;
                          return (
                            <span key={type}
                              className={`badge inline-flex items-center gap-1 px-3 py-1 rounded border text-[11px] font-semibold ${
                                active
                                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                  : 'bg-white text-[#8b9cb5] border-[#d4c9a8]'
                              }`}
                              style={active ? { backgroundColor: '#1e3a5f', color: 'white' } : {}}>
                              <span className="material-symbols-outlined text-xs">{icons[type]}</span>
                              {labels[type]}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* เนื่องจาก (เหตุผล) */}
                    <div className="text-xs text-[#3d4f5f] flex items-start gap-1">
                      <span className="font-semibold text-[#1e3a5f] whitespace-nowrap">เนื่องจาก</span>
                      <span className="dot-val flex-1 min-h-[22px]">{reasonText || '................................................................................................'}</span>
                    </div>

                    {/* กำหนดวันลา */}
                    <div className="date-section bg-[#f0f4f8] border border-[#d0dbe6] rounded-lg p-3 text-xs">
                      <div className="font-semibold text-[#1e3a5f] uppercase tracking-widest text-[9px] flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-[10px]">date_range</span>
                        กำหนดวันลา
                      </div>
                      <div className="flex flex-wrap items-end gap-x-3 gap-y-1 text-[#3d4f5f]">
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">ตั้งแต่</span>
                          <span className="dot-val min-w-[120px]">{formatDateLabel(fromDate)}</span>
                        </span>
                        <span className="text-[#8b9cb5]">→</span>
                        <span>
                          <span className="font-semibold text-[#1e3a5f]">ถึง</span>
                          <span className="dot-val min-w-[120px]">{formatDateLabel(toDate)}</span>
                        </span>
                        <span className="text-[#8b9cb5]">=</span>
                        <span className="font-bold text-[#1e3a5f]">{totalDays} วัน / Days</span>
                      </div>
                    </div>

                    {/* ติดต่อ */}
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-1 text-xs text-[#3d4f5f]">
                      <span>
                        <span className="font-semibold text-[#1e3a5f]">ติดต่อได้ที่</span>
                        <span className="dot-val min-w-[200px]">{contactAddress || '.............................................'}</span>
                      </span>
                      <span>
                        <span className="font-semibold text-[#1e3a5f]">โทร</span>
                        <span className="dot-val min-w-[100px]">{contactPhone || '.....................'}</span>
                      </span>
                    </div>

                    {/* สถิติการลาในปีงบประมาณนี้ */}
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-[#1e3a5f] uppercase tracking-widest text-[9px] text-[#8b6914] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">table_chart</span>
                        สถิติการลาในปีงบประมาณนี้
                      </div>
                      <table className="stats-table w-full border border-[#c5b99b] text-center border-collapse">
                        <thead>
                          <tr className="bg-[#f8f6f0]">
                            <th className="border border-[#c5b99b] p-1 font-semibold text-[#1e3a5f]">ประเภทลา</th>
                            <th className="border border-[#c5b99b] p-1 font-semibold text-[#1e3a5f] w-24">ลามาแล้ว (วัน)</th>
                            <th className="border border-[#c5b99b] p-1 font-semibold text-[#1e3a5f] w-20">ลาครั้งนี้</th>
                            <th className="border border-[#c5b99b] p-1 font-semibold text-[#1e3a5f] w-20">รวมเป็น</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-[#c5b99b] p-1 text-left font-bold text-[#1e3a5f]">ป่วย / Sick</td>
                            <td className="border border-[#c5b99b] p-1">{sickTaken}</td>
                            <td className="border border-[#c5b99b] p-1">{currentSick}</td>
                            <td className="border border-[#c5b99b] p-1 font-semibold">{sickTotal}</td>
                          </tr>
                          <tr>
                            <td className="border border-[#c5b99b] p-1 text-left font-bold text-[#1e3a5f]">กิจส่วนตัว / Personal</td>
                            <td className="border border-[#c5b99b] p-1">{personalTaken}</td>
                            <td className="border border-[#c5b99b] p-1">{currentPersonal}</td>
                            <td className="border border-[#c5b99b] p-1 font-semibold">{personalTotal}</td>
                          </tr>
                          <tr>
                            <td className="border border-[#c5b99b] p-1 text-left font-bold text-[#1e3a5f]">ลาคลอด / Maternity</td>
                            <td className="border border-[#c5b99b] p-1">{maternityTaken}</td>
                            <td className="border border-[#c5b99b] p-1">{currentMaternity}</td>
                            <td className="border border-[#c5b99b] p-1 font-semibold">{maternityTotal}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* ลายเซ็นแนบ */}
                    <div className="border-t border-dashed border-[#c5b99b] pt-4">
                      <div className="sig-area flex flex-col items-end pr-8 gap-1">
                        <span className="text-[11px] text-[#6b7c8d]">ขอแสดงความนับถือ</span>
                        <div className="sig-block flex flex-col items-center gap-0.5 mt-1">
                          {signatureType === 'DRAW' && signatureImage ? (
                            <div className="h-10 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={signatureImage} alt="Signature" className="sig-img max-h-full object-contain" />
                            </div>
                          ) : (
                            <span className="sig-name text-base font-serif italic border-b border-[#1e3a5f] px-4 py-0.5 text-[#1e3a5f]">
                              {signatureText || fullName || '.........................'}
                            </span>
                          )}
                          <span className="sig-label text-[9px] text-[#8b9cb5]">(ลงชื่อ) {fullName || '.........................'}</span>
                          {position && <span className="sig-label text-[9px] text-[#8b9cb5]">ตำแหน่ง {position}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Gold footer bar */}
                    <div className="gold-bar h-1 bg-linear-to-r from-[#8b6914] via-[#d4a843] to-[#8b6914] -mx-10 -mb-10 mt-6" />

                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
