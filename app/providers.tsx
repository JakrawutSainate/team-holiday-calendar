'use client';

import * as React from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/src/components/LanguageContext';
import { RoleProvider } from '@/src/components/RoleContext';
import { AuthProvider } from '@/src/components/AuthContext';
import { ConfirmProvider } from '@/src/components/ConfirmDialog';
import { BackendStatusMonitor } from '@/src/components/BackendStatusMonitor';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoleProvider>
          <ConfirmProvider>
            <BackendStatusMonitor />
            {children}
            <Toaster
              position="top-right"
              richColors
              expand={false}
              visibleToasts={4}
              toastOptions={{ duration: 3500 }}
            />
          </ConfirmProvider>
        </RoleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
