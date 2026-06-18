'use client';

import * as React from 'react';
import { LanguageProvider } from '@/src/components/LanguageContext';
import { RoleProvider } from '@/src/components/RoleContext';

import { AuthProvider } from '@/src/components/AuthContext';
import { AuthGuard } from '@/src/components/AuthGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoleProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </RoleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
