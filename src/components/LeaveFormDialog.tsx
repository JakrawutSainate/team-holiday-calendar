'use client';

import { useState, useRef, useEffect } from 'react';

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

export function LeaveFormDialog({ open, onClose, onSubmit, tokens, language, prefillDate }: LeaveFormDialogProps) {
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open) {
      setDate(prefillDate || '');
    }
  }, [open, prefillDate]);
  const [reason, setReason] = useState('');
  const [signatureType, setSignatureType] = useState<'DRAW' | 'TEXT'>('TEXT');
  const [signatureText, setSignatureText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [attachmentImage, setAttachmentImage] = useState('');
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (open && signatureType === 'DRAW') {
      initCanvas();
    }
  }, [open, signatureType]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#18181b'; // zinc-900
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  };

  if (!open) return null;

  const handleClose = () => {
    setDate('');
    setReason('');
    setSignatureType('TEXT');
    setSignatureText('');
    setSignatureImage('');
    setAttachmentImage('');
    setError('');
    onClose();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support Touch Events
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasImage();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage('');
  };

  const saveCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureImage(dataUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentImage(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (!reason.trim()) {
      setError(language === 'th' ? 'กรุณาระบุเหตุผลการลา' : 'Please specify leave reason');
      return;
    }

    if (signatureType === 'TEXT' && !signatureText.trim()) {
      setError(language === 'th' ? 'กรุณาพิมพ์ลายเซ็นชื่อของคุณ' : 'Please type your signature name');
      return;
    }

    if (signatureType === 'DRAW' && !signatureImage) {
      setError(language === 'th' ? 'กรุณาวาดลายเซ็นของคุณ' : 'Please draw your signature');
      return;
    }

    onSubmit(date, reason, signatureType, signatureText, signatureImage, attachmentImage);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
            {language === 'th' ? 'ยื่นใบลาอิเล็กทรอนิกส์' : 'E-Leave Request'}
          </h3>
          <p className="text-sm text-zinc-500 font-medium">
            {language === 'th'
              ? `ใช้ 1 โทเค็นต่อวัน · โทเค็นคงเหลือของคุณ: ${tokens} โทเค็น`
              : `Costs 1 token per day · Balance: ${tokens} tokens`}
          </p>
        </div>

        <div className="space-y-4">
          {/* Leave Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {language === 'th' ? 'วันที่ต้องการลา' : 'Leave Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all bg-white text-zinc-900 font-medium"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {language === 'th' ? 'เหตุผลการลา / รายละเอียด' : 'Leave Reason / Details'}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder={language === 'th' ? 'ระบุเหตุผลในการลางาน เช่น ลาพักผ่อนส่วนตัว...' : 'Specify leave reason...'}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all bg-white text-zinc-900"
            />
          </div>

          {/* Upload Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              {language === 'th' ? 'อัปโหลดภาพแนบประกอบ (ทางเลือก)' : 'Attach Image Document (Optional)'}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="leave-image-upload"
                className="hidden"
              />
              <label
                htmlFor="leave-image-upload"
                className="px-4 py-2 border border-zinc-200 hover:border-zinc-950 rounded-xl text-sm font-semibold cursor-pointer hover:bg-zinc-50 transition-all flex items-center gap-2 text-zinc-700"
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                {language === 'th' ? 'เลือกรูปภาพ' : 'Choose Image'}
              </label>
              {attachmentImage && (
                <div className="relative w-12 h-12 rounded-lg border border-zinc-100 overflow-hidden bg-zinc-50 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachmentImage} alt="Attachment thumbnail" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAttachmentImage('')}
                    className="absolute inset-0 bg-red-600/80 hover:bg-red-700 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Signature Type Selector */}
          <div className="space-y-2 border-t border-zinc-100 pt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {language === 'th' ? 'ลายมือชื่ออิเล็กทรอนิกส์' : 'Digital Signature'}
              </label>
              <div className="flex border border-zinc-200 rounded-lg p-0.5 text-xs bg-zinc-50">
                <button
                  type="button"
                  onClick={() => { setSignatureType('TEXT'); setError(''); }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    signatureType === 'TEXT'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {language === 'th' ? 'พิมพ์ชื่อ' : 'Type Name'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSignatureType('DRAW'); setError(''); }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    signatureType === 'DRAW'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {language === 'th' ? 'เขียนลายเซ็น' : 'Draw Sign'}
                </button>
              </div>
            </div>

            {signatureType === 'TEXT' ? (
              <input
                type="text"
                value={signatureText}
                onChange={(e) => { setSignatureText(e.target.value); setError(''); }}
                placeholder={language === 'th' ? 'พิมพ์ชื่อ-นามสกุลจริงของคุณที่นี่...' : 'Type your full name here...'}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all bg-zinc-50/50 italic text-zinc-900"
              />
            ) : (
              <div className="space-y-2">
                <div className="relative border border-zinc-200 rounded-2xl bg-zinc-50 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={430}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full cursor-crosshair h-[120px]"
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 p-1.5 bg-white hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 border border-zinc-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-bold flex items-center justify-center">refresh</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {language === 'th' ? '*เขียนลายมือชื่อด้วยนิ้วหรือเมาส์ลงบนกรอบด้านบน' : '*Draw signature with mouse or finger'}
                </p>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-semibold mt-1">{error}</p>}

        <div className="flex gap-3 justify-end border-t border-zinc-100 pt-4">
          <button
            onClick={handleClose}
            className="px-5 py-3 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {language === 'th' ? 'ยื่นใบลา' : 'Submit Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}
