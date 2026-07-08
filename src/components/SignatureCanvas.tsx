'use client';

import { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
  onChange: (base64Data: string) => void;
  width?: number;
  height?: number;
  placeholderText?: string;
  clearText?: string;
}

export default function SignatureCanvas({
  onChange,
  width = 500,
  height = 180,
  placeholderText = 'วาดลายเซ็นของคุณที่นี่ / Sign your signature here',
  clearText = 'ล้างลายเซ็น / Clear'
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Set canvas display resolution for retina/high-DPI screens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and config
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Support Touch Events
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    // Support Mouse Events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      // Export signature to Base64
      const base64 = canvas.toDataURL('image/png');
      onChange(base64);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl overflow-hidden bg-zinc-50 transition-colors h-[180px]">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-sm font-medium px-4 text-center select-none">
            {placeholderText}
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearCanvas}
          disabled={isEmpty}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors py-1 px-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
          {clearText}
        </button>
      </div>
    </div>
  );
}
