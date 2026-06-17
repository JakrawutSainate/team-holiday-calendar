'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'ADMIN' | 'USER';

interface RoleContextProps {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('ADMIN');

  useEffect(() => {
    // Force ADMIN role for unified access to both admin settings and user features
    setRoleState('ADMIN');
  }, []);

  const setRole = (newRole: Role) => {
    // No-op to prevent role switching from updating state
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
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
