'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, CapacitySetting, AuditLog } from '../types';
import { fetchTeamMembersAction, fetchCapacitySettingsAction, fetchAuditLogsAction } from '../actions';
import { useRole } from '@/src/components/RoleContext';

interface MasterDataContextType {
  members: Member[];
  capacitySettings: CapacitySetting[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [capacitySettings, setCapacitySettings] = useState<CapacitySetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Perform requests in parallel
      const promises: [Promise<Member[]>, Promise<CapacitySetting[]>, Promise<AuditLog[]>] = [
        fetchTeamMembersAction(),
        fetchCapacitySettingsAction(),
        role === 'ADMIN' ? fetchAuditLogsAction() : Promise.resolve([])
      ];

      const [membersData, capacityData, logsData] = await Promise.all(promises);

      setMembers(membersData);
      setCapacitySettings(capacityData);
      setAuditLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load Master Data Context:', err);
      setError(err?.message || 'Failed to sync Master Data resources.');
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <MasterDataContext.Provider
      value={{
        members,
        capacitySettings,
        auditLogs,
        isLoading,
        error,
        refreshData
      }}
    >
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}
