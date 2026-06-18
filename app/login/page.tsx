'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { openLogin } = useAuth();

  useEffect(() => {
    router.replace('/calendar');
    openLogin();
  }, [router, openLogin]);

  return null;
}
