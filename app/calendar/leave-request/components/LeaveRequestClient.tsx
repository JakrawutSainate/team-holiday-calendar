'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/src/components/AuthContext';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { LeaveRequestController } from './LeaveRequestController';
import { cancelLeaveMutation } from '@/src/libs/calendarData';
import { LeaveRequestValidator } from '../schema';
import { LeaveFormData, LeaveStats } from '@/src/types/leave';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { getUserSavedSignatureAction } from '@/app/settings/actions';

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
  const [department, setDepartment] = useState('');
  const [leaveType, setLeaveType] = useState<'SICK' | 'PERSONAL' | 'MATERNITY'>('SICK');
  const [reasonText, setReasonText] = useState('');
  const [fromDate, setFromDate] = useState(dateParam);
  const [toDate, setToDate] = useState(dateParam);
  const [totalDays, setTotalDays] = useState(1);
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [signatureType, setSignatureType] = useState<'SAVED' | 'DRAW' | 'TEXT'>('TEXT');
  const [signatureText, setSignatureText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [attachmentImage, setAttachmentImage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Separate state holding the document display values loaded from DB (viewOnly mode)
  // This is set ONCE when loading and never overridden by form effects
  const [docView, setDocView] = useState<{
    writtenAt: string;
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
    signature: string | null;
    sickTaken: number;
    personalTaken: number;
    maternityTaken: number;
    currentSick: number;
    currentPersonal: number;
    currentMaternity: number;
  } | null>(null);

  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);

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

  // Fetch user's saved signature from Master Data on demand
  useEffect(() => {
    async function fetchSig() {
      if (!user) return;
      try {
        const sig = await getUserSavedSignatureAction();
        setSavedSignature(sig);
      } catch (err) {
        console.error('Failed to load saved signature:', err);
      } finally {
        setLoadingSignature(false);
      }
    }
    fetchSig();
  }, [user]);

  // Load controller state and check for existing leave document
  useEffect(() => {
    if (user?.id) {
      controller.updateParams(user.id);
      controller.loadState().then(() => {
        if (!dateParam) return;

        const existingEvent = controller.getAllEvents().find(
          e => e.userId === user.id && e.date === dateParam && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
        );
        const existingDoc = controller.getLeaveDocuments().find(
          d => d.userId === user.id && d.leaveDate === dateParam
        );

        if (!existingEvent && !existingDoc) return;
        setViewOnly(true);

        if (!existingDoc) return;

        // Calculate stats at load time
        const stats = controller.calculatePastLeaveDays(dateParam);

        // --- Determine leave type ---
        const lt = (existingDoc.leaveType === 'SICK' || existingDoc.leaveType === 'PERSONAL' || existingDoc.leaveType === 'MATERNITY')
          ? existingDoc.leaveType as 'SICK' | 'PERSONAL' | 'MATERNITY'
          : 'SICK';

        // --- Primary: use explicit DB columns (new format) ---
        const hasExplicitFields = Boolean(existingDoc.fromDate || existingDoc.toDate || existingDoc.contactAddress || existingDoc.contactPhone || existingDoc.writtenAt || existingDoc.recipientTitle);

        if (hasExplicitFields) {
          const td = existingDoc.totalDays || 1;
          // Try to get stats and reasonText from JSON reason if available
          let savedSick = stats.SICK, savedPersonal = stats.PERSONAL, savedMat = stats.MATERNITY;
          let jsonFullName = '', jsonPosition = '', jsonDepartment = '', jsonReasonText = existingDoc.reason || '';
          try {
            const parsed = JSON.parse(existingDoc.reason || 'null');
            if (parsed && typeof parsed === 'object') {
              if (parsed.stats) {
                if (parsed.stats.sick?.taken    !== undefined) savedSick     = Number(parsed.stats.sick.taken);
                if (parsed.stats.personal?.taken !== undefined) savedPersonal = Number(parsed.stats.personal.taken);
                if (parsed.stats.maternity?.taken !== undefined) savedMat    = Number(parsed.stats.maternity.taken);
              }
              if (parsed.fullName)   jsonFullName   = parsed.fullName;
              if (parsed.position)   jsonPosition   = parsed.position;
              if (parsed.department) jsonDepartment = parsed.department;
              if (parsed.reasonText !== undefined) jsonReasonText = parsed.reasonText;
            }
          } catch { /* reason is plain text */ }

          setDocView({
            writtenAt:       existingDoc.writtenAt      || 'กรุงเทพมหานคร',
            recipientTitle:  existingDoc.recipientTitle || 'หัวหน้างาน',
            fullName:        jsonFullName  || existingDoc.userName   || user.name       || '',
            position:        jsonPosition  || existingDoc.title      || user.title      || '',
            department:      jsonDepartment|| existingDoc.department || user.department || '',
            leaveType:       lt,
            reasonText:      jsonReasonText,
            fromDate:        existingDoc.fromDate  || dateParam,
            toDate:          existingDoc.toDate    || dateParam,
            totalDays:       td,
            contactAddress:  existingDoc.contactAddress || '',
            contactPhone:    existingDoc.contactPhone   || '',
            signature:       existingDoc.signature || savedSignature,
            sickTaken:       savedSick,
            personalTaken:   savedPersonal,
            maternityTaken:  savedMat,
            currentSick:     lt === 'SICK'     ? td : 0,
            currentPersonal: lt === 'PERSONAL' ? td : 0,
            currentMaternity:lt === 'MATERNITY'? td : 0,
          });
          return;
        }

        // --- Fallback: parse full JSON reason (submitted after abebf1d but before db push) ---
        try {
          const parsed = JSON.parse(existingDoc.reason || 'null');
          if (parsed && typeof parsed === 'object' && parsed.leaveType) {
            const td = Number(parsed.totalDays) || 1;
            const savedSick     = parsed.stats?.sick?.taken     !== undefined ? Number(parsed.stats.sick.taken)     : stats.SICK;
            const savedPersonal = parsed.stats?.personal?.taken !== undefined ? Number(parsed.stats.personal.taken) : stats.PERSONAL;
            const savedMat      = parsed.stats?.maternity?.taken !== undefined ? Number(parsed.stats.maternity.taken): stats.MATERNITY;
            setDocView({
              writtenAt:       parsed.writtenAt      || 'กรุงเทพมหานคร',
              recipientTitle:  parsed.recipientTitle || 'หัวหน้างาน',
              fullName:        parsed.fullName       || existingDoc.userName   || user.name       || '',
              position:        parsed.position       || existingDoc.title      || user.title      || '',
              department:      parsed.department     || existingDoc.department || user.department || '',
              leaveType:       lt,
              reasonText:      parsed.reasonText     || '',
              fromDate:        parsed.fromDate       || dateParam,
              toDate:          parsed.toDate         || dateParam,
              totalDays:       td,
              contactAddress:  parsed.contactAddress || '',
              contactPhone:    parsed.contactPhone   || '',
              signature:       existingDoc.signature || savedSignature,
              sickTaken:       savedSick,
              personalTaken:   savedPersonal,
              maternityTaken:  savedMat,
              currentSick:     lt === 'SICK'     ? td : 0,
              currentPersonal: lt === 'PERSONAL' ? td : 0,
              currentMaternity:lt === 'MATERNITY'? td : 0,
            });
            return;
          }
        } catch { /* fall through to plain text */ }

        // --- Last resort: plain text reason (oldest records) ---
        setDocView({
          writtenAt:       'กรุงเทพมหานคร',
          recipientTitle:  'หัวหน้างาน',
          fullName:        existingDoc.userName   || user.name       || '',
          position:        existingDoc.title      || user.title      || '',
          department:      existingDoc.department || user.department || '',
          leaveType:       lt,
          reasonText:      existingDoc.reason || '',
          fromDate:        dateParam,
          toDate:          dateParam,
          totalDays:       1,
          contactAddress:  '',
          contactPhone:    '',
          signature:       existingDoc.signature || savedSignature,
          sickTaken:       stats.SICK,
          personalTaken:   stats.PERSONAL,
          maternityTaken:  stats.MATERNITY,
          currentSick:     lt === 'SICK'     ? 1 : 0,
          currentPersonal: lt === 'PERSONAL' ? 1 : 0,
          currentMaternity:lt === 'MATERNITY'? 1 : 0,
        });
      });
    }
  }, [user?.id, dateParam, controller, savedSignature]);

  // Prefill user data on load (form state, NOT docView)
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPosition(user.title || '');
      setDepartment(user.department || '');
      setSignatureText(user.name || '');
    }
  }, [user]);

  // Auto-calculate duration days (form only)
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
        ctx.strokeStyle = '#000000';
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

  // Calculate past leave days based on fiscal year in DB
  const calculatedStats = controller.calculatePastLeaveDays(fromDate);

  // Form-state stats (used when NOT viewOnly)
  const formSickTaken     = calculatedStats.SICK;
  const formPersonalTaken = calculatedStats.PERSONAL;
  const formMatTaken      = calculatedStats.MATERNITY;
  const currentSick     = leaveType === 'SICK'     ? totalDays : 0;
  const currentPersonal = leaveType === 'PERSONAL' ? totalDays : 0;
  const currentMaternity= leaveType === 'MATERNITY'? totalDays : 0;

  // Computed display values — uses docView when viewOnly, otherwise live form state
  const dv = {
    writtenAt:      viewOnly && docView ? docView.writtenAt      : writtenAt,
    recipientTitle: viewOnly && docView ? docView.recipientTitle : recipientTitle,
    fullName:       viewOnly && docView ? docView.fullName       : fullName,
    position:       viewOnly && docView ? docView.position       : position,
    department:     viewOnly && docView ? docView.department     : department,
    leaveType:      viewOnly && docView ? docView.leaveType      : leaveType,
    reasonText:     viewOnly && docView ? docView.reasonText     : reasonText,
    fromDate:       viewOnly && docView ? docView.fromDate       : fromDate,
    toDate:         viewOnly && docView ? docView.toDate         : toDate,
    totalDays:      viewOnly && docView ? docView.totalDays      : totalDays,
    contactAddress: viewOnly && docView ? docView.contactAddress : contactAddress,
    contactPhone:   viewOnly && docView ? docView.contactPhone   : contactPhone,
    signature:      viewOnly && docView ? docView.signature      : savedSignature,
    sickTaken:      viewOnly && docView ? docView.sickTaken      : formSickTaken,
    personalTaken:  viewOnly && docView ? docView.personalTaken  : formPersonalTaken,
    maternityTaken: viewOnly && docView ? docView.maternityTaken : formMatTaken,
    currentSick:    viewOnly && docView ? docView.currentSick    : currentSick,
    currentPersonal:viewOnly && docView ? docView.currentPersonal: currentPersonal,
    currentMaternity:viewOnly && docView ? docView.currentMaternity: currentMaternity,
  };
  const sickTotal     = dv.sickTaken     + dv.currentSick;
  const personalTotal = dv.personalTaken + dv.currentPersonal;
  const maternityTotal= dv.maternityTaken+ dv.currentMaternity;

  const statsObj = {
    sick:     { taken: formSickTaken,     current: currentSick,     total: formSickTaken + currentSick },
    personal: { taken: formPersonalTaken, current: currentPersonal, total: formPersonalTaken + currentPersonal },
    maternity:{ taken: formMatTaken,      current: currentMaternity,total: formMatTaken + currentMaternity },
  };

  const handleSubmit = async () => {
    setError('');

    if (!savedSignature) {
      const msg = language === 'th' ? 'กรุณาตั้งค่าลายเซ็นใน Master Data ก่อนยื่นใบลา' : 'Please configure your signature in Master Data before submitting leave';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!fromDate) {
      const msg = language === 'th' ? 'กรุณาระบุวันที่เริ่มลา' : 'Please specify start date';
      setError(msg);
      toast.error(msg);
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
        level: '',
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
        'SAVED',
        user?.name || '',
        savedSignature,
        ''
      );

      // Instantly set docView so the viewOnly mode shows exact submitted data without delay/race
      setDocView({
        writtenAt,
        recipientTitle,
        fullName,
        position,
        department,
        leaveType,
        reasonText,
        fromDate,
        toDate: toDate || fromDate,
        totalDays,
        contactAddress,
        contactPhone,
        signature: savedSignature,
        sickTaken: formSickTaken,
        personalTaken: formPersonalTaken,
        maternityTaken: formMatTaken,
        currentSick,
        currentPersonal,
        currentMaternity,
      });

      await controller.loadState();

      toast.success(
        language === 'th' ? 'ยื่นใบลาสำเร็จและบันทึกเอกสารแล้ว' : 'Leave Requested & Document Saved',
        { description: language === 'th' ? 'หัก 1 โทเค็นและลงทะเบียนแบบใบลาเรียบร้อยแล้ว' : 'Deducted 1 token and saved official leave document!' }
      );
      setViewOnly(true);
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
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(x => x.outerHTML)
      .join('\n');
    win.document.write(`<html><head><title>แบบใบลา - ${fullName}</title>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                    {viewOnly
                      ? (language === 'th' ? 'แบบใบลาพักผ่อน (ฉบับสมบูรณ์)' : 'Official Leave Document')
                      : (language === 'th' ? 'ยื่นแบบใบลาพักผ่อน' : 'New Leave Request')}
                  </h2>
                  {viewOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {language === 'th' ? 'ยื่นสำเร็จแล้ว' : 'Submitted'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  {viewOnly
                    ? (language === 'th' ? 'เอกสารยื่นลาฉบับสมบูรณ์สำหรับตรวจสอบและพิมพ์ลงกระดาษ' : 'Official leave document for review and printing.')
                    : (language === 'th' ? 'กรอกรายละเอียดและตรวจสอบความถูกต้องของลายเซ็นตามจริงด้านล่าง' : 'Fill in the form on the left and preview the official document on the right.')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {viewOnly ? (
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-0"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>{language === 'th' ? 'พิมพ์ใบลา' : 'Print'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#fcf4e0] text-[#8b6914] px-4 py-2 rounded-xl border border-[#ebd8ad]">
                    <span className="material-symbols-outlined text-sm">toll</span>
                    {language === 'th' ? `โทเค็นคงเหลือ: ${controller.getTokens()}` : `Balance: ${controller.getTokens()} tokens`}
                  </span>
                )}
              </div>
            </div>

            <div className={viewOnly ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"}>
              
              {/* ════ LEFT COLUMN: INPUT FORM (Hidden in viewOnly mode) ════ */}
              {!viewOnly && (
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
                      * สถิตินับจากประวัติการยื่นลาในปีงบประมาณปัจจุบันแบบอัตโนมัติ
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
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold text-zinc-700">{formSickTaken}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentSick}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{formSickTaken + currentSick}</td>
                        </tr>
                        <tr>
                          <td className="border border-zinc-200 px-2 py-1.5 font-bold text-[#1e3a5f]">กิจส่วนตัว / Personal</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold text-zinc-700">{formPersonalTaken}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentPersonal}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{formPersonalTaken + currentPersonal}</td>
                        </tr>
                        <tr>
                          <td className="border border-zinc-200 px-2 py-1.5 font-bold text-[#1e3a5f]">คลอดบุตร / Maternity</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold text-zinc-700">{formMatTaken}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold">{currentMaternity}</td>
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-bold text-zinc-800">{formMatTaken + currentMaternity}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ลงลายเซ็น (Master Data) */}
                <div className="border-t border-zinc-100 pt-5 space-y-4">
                  <label className={labelClass}>ลงชื่อผู้ยื่นใบลา / Signature (Master Data)</label>
                  
                  {loadingSignature ? (
                    <div className="flex items-center justify-center py-6 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full" />
                    </div>
                  ) : savedSignature ? (
                    <div className="flex flex-col items-center gap-1.5 py-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                      <div className="relative p-3 max-w-[320px] w-full flex items-center justify-center min-h-[90px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={savedSignature} alt="Master Data Signature" className="max-h-[85px] object-contain" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400">({language === 'th' ? 'ลายเซ็นจาก Master Data' : 'Master Data Signature'})</span>
                    </div>
                  ) : (
                    <div className="p-5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                          <span className="material-symbols-outlined text-xl">draw</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            {language === 'th' ? 'ยังไม่ได้ตั้งค่าลายเซ็นในระบบ' : 'No signature configured'}
                          </p>
                          <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                            {language === 'th'
                              ? 'กรุณาเพิ่มลายเซ็นใน Master Data ก่อนยื่นใบลา'
                              : 'Please add your signature in Master Data settings before submitting leave.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/master-data/signatures')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>{language === 'th' ? 'ไปตั้งค่าลายเซ็น (Master Data)' : 'Go to Signature Settings'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
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
                  <button onClick={handleSubmit} disabled={submitting || loadingSignature || !savedSignature}
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
              )}

              {/* ════ RIGHT COLUMN / FULL DOCUMENT PREVIEW ════ */}
              <div className={viewOnly ? "w-full max-w-3xl space-y-4" : "sticky top-6 space-y-4"}>
                {!viewOnly && (
                  <div className="flex justify-between items-center bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-xs">
                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#8b6914] text-sm">visibility</span>
                      เอกสารใบลาจำลอง (Live Document Preview)
                    </span>
                    <button onClick={handlePrint}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#d4a843] hover:bg-[#c49835] text-[#1e3a5f] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs border-0">
                      <span className="material-symbols-outlined text-sm">print</span>
                      พิมพ์ / PDF (Print)
                    </button>
                  </div>
                )}

                {/* ═══ Document Frame ═══ */}
                <div ref={printRef} className="print-page overflow-hidden border border-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white text-black leading-relaxed" style={{ fontSize: 13, color: '#000' }}>
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
                        <span className="border-b border-dotted border-black flex-1 text-center font-bold min-h-[18px]">{dv.writtenAt || '..................................'}</span>
                      </div>
                      <div className="flex items-end gap-1 w-full max-w-[320px] whitespace-nowrap">
                        <span className="whitespace-nowrap">วันที่</span>
                        <span className="border-b border-dotted border-black w-10 text-center font-bold min-h-[18px]">{today.getDate()}</span>
                        <span className="whitespace-nowrap">เดือน</span>
                        <span className="border-b border-dotted border-black w-24 text-center font-bold min-h-[18px]">{thaiMonths[today.getMonth()]}</span>
                        <span className="whitespace-nowrap">พ.ศ.</span>
                        <span className="border-b border-dotted border-black w-14 text-center font-bold min-h-[18px]">{today.getFullYear() + 543}</span>
                      </div>
                    </div>

                    {/* เรื่อง / เรียน */}
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-bold">เรื่อง</span> ขออนุญาตลา
                      </div>
                      <div className="flex flex-wrap items-center gap-1 w-full">
                        <span className="font-bold">เรียน</span>
                        <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[200px]">{dv.recipientTitle || '......................................................................'}</span>
                      </div>
                    </div>

                    {/* ข้อมูลผู้ลา */}
                    <div className="text-xs space-y-4 leading-loose text-justify text-zinc-950">
                      <div className="indent-8">
                        ข้าพเจ้า <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[200px] text-center">{dv.fullName || '......................................................................'}</span>
                        ตำแหน่ง <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[150px] text-center">{dv.position || '....................................'}</span>
                      </div>
                      <div className="indent-8">
                        สังกัด <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full min-w-[200px] text-center">{dv.department || '......................................................................'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2">
                        <span>ขอลา</span>
                        <span className="inline-flex items-center gap-1.5 ml-4">
                          <input type="checkbox" checked={dv.leaveType === 'SICK'} readOnly className="accent-black" />
                          <span>ป่วย</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 ml-4">
                          <input type="checkbox" checked={dv.leaveType === 'PERSONAL'} readOnly className="accent-black" />
                          <span>กิจส่วนตัว</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 ml-4">
                          <input type="checkbox" checked={dv.leaveType === 'MATERNITY'} readOnly className="accent-black" />
                          <span>คลอดบุตร</span>
                        </span>
                      </div>

                      <div className="flex items-end w-full gap-2">
                        <span>เนื่องจาก</span>
                        <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[250px]">{dv.reasonText || '................................................................................................'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                        <span>ตั้งแต่วันที่</span>
                        <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[130px]">{formatDateLabel(dv.fromDate)}</span>
                        <span>ถึงวันที่</span>
                        <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[130px]">{formatDateLabel(dv.toDate)}</span>
                        <span>มีกำหนด</span>
                        <span className="border-b border-dotted border-black px-2 font-bold text-center inline-block min-w-[40px]">{dv.totalDays}</span>
                        <span>วัน</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 w-full">
                        <span>ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่</span>
                        <span className="border-b border-dotted border-black px-2 font-bold break-words inline-block max-w-full flex-1 min-w-[300px]">{dv.contactAddress || '................................................................................................................'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 w-full">
                        <span>หมายเลขโทรศัพท์</span>
                        <span className="border-b border-dotted border-black px-2 font-bold inline-block min-w-[180px]">{dv.contactPhone || '....................................'}</span>
                      </div>
                    </div>

                    {/* ขอแสดงความนับถือ */}
                    <div className="flex flex-col items-end pr-8 text-xs space-y-1 mt-4">
                      <div className="flex flex-col items-center space-y-1">
                        <span>ขอแสดงความนับถือ</span>
                        <div className="h-12 flex items-center justify-center py-1 min-w-[140px]">
                          {(() => {
                            const sigSrc = dv.signature;
                            return sigSrc && sigSrc.startsWith('data:image') ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={sigSrc} alt="Signature" className="max-h-full object-contain" />
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-end gap-1">
                          <span>(ลงชื่อ)</span>
                          <span className="border-b border-dotted border-black w-[160px] text-center font-bold">{dv.fullName || user?.name || ''}</span>
                        </div>
                        <div className="flex items-end gap-1">
                          <span>(ตัวบรรจง)</span>
                          <span className="border-b border-dotted border-black w-[160px] text-center font-bold">{dv.fullName || user?.name || ''}</span>
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
                              <td className="border border-black p-1">{dv.sickTaken}</td>
                              <td className="border border-black p-1">{dv.currentSick}</td>
                              <td className="border border-black p-1 font-bold">{sickTotal}</td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 text-left font-bold">กิจส่วนตัว</td>
                              <td className="border border-black p-1">{dv.personalTaken}</td>
                              <td className="border border-black p-1">{dv.currentPersonal}</td>
                              <td className="border border-black p-1 font-bold">{personalTotal}</td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 text-left font-bold">คลอดบุตร</td>
                              <td className="border border-black p-1">{dv.maternityTaken}</td>
                              <td className="border border-black p-1">{dv.currentMaternity}</td>
                              <td className="border border-black p-1 font-bold">{maternityTotal}</td>
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
