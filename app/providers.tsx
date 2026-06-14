'use client';

import * as React from 'react';
import { LanguageProvider } from '@/src/components/LanguageContext';
import { RoleProvider } from '@/src/components/RoleContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RoleProvider>
        {children}
      </RoleProvider>
    </LanguageProvider>
  );
}
