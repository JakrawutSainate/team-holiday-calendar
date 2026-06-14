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
    const savedRole = localStorage.getItem('holidayhq_role') as Role;
    if (savedRole === 'ADMIN' || savedRole === 'USER') {
      setRoleState(savedRole);
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem('holidayhq_role', newRole);
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
