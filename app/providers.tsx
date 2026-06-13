'use client';

import * as React from 'react';
import { LanguageProvider } from '@/src/components/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
