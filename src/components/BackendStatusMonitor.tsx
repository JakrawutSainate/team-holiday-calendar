'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function BackendStatusMonitor() {
  useEffect(() => {
    const handleDown = () => {
      toast.warning('ไม่สามารถเชื่อมต่อ Backend ได้', {
        description: 'ระบบแสดงข้อมูลในโหมดจำกัด · กรุณาตรวจสอบการตั้งค่า Backend Server',
        id: 'backend-down',
        duration: Infinity,
      });
    };

    const handleUp = () => toast.dismiss('backend-down');

    window.addEventListener('backend:unavailable', handleDown);
    window.addEventListener('backend:available', handleUp);

    return () => {
      window.removeEventListener('backend:unavailable', handleDown);
      window.removeEventListener('backend:available', handleUp);
    };
  }, []);

  return null;
}
