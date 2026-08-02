'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

export type Role = 'ADMIN' | 'USER';

interface RoleContextProps {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Resolve role dynamically: ADMIN/LEAD map to 'ADMIN', others/unauthenticated map to 'USER'
  const role: Role = user && (user.role === 'ADMIN' || user.role === 'LEAD') ? 'ADMIN' : 'USER';

  const setRole = useCallback((_newRole: Role) => {
    // No-op (role resolved dynamically from AuthContext)
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
