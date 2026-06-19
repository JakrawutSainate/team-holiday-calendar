'use client';

import * as React from 'react';
import { LanguageProvider } from '@/src/components/LanguageContext';
import { RoleProvider } from '@/src/components/RoleContext';
import { AuthProvider } from '@/src/components/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoleProvider>
          {children}
        </RoleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
