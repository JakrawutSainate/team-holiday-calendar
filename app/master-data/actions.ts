'use server';

import { runGraphQLAction } from '@/src/actions/auth';
import { Member, CapacitySetting, AuditLog } from './types';

export async function fetchTeamMembersAction(): Promise<Member[]> {
  try {
    const res = await runGraphQLAction(`
      query {
        getTeamMembers {
          id
          name
          email
          role
          department
          title
          tokensBalance
          savedSignature
          sickLeaveBalance
          annualLeaveBalance
        }
      }
    `);
    return res?.data?.getTeamMembers ?? [];
  } catch (err) {
    console.error('fetchTeamMembersAction error:', err);
    return [];
  }
}

export async function fetchCapacitySettingsAction(): Promise<CapacitySetting[]> {
  try {
    const res = await runGraphQLAction(`
      query {
        getCapacitySettings {
          id
          date
          dayOfWeek
          maxOffAllowed
          description
        }
      }
    `);
    return res?.data?.getCapacitySettings ?? [];
  } catch (err) {
    console.error('fetchCapacitySettingsAction error:', err);
    return [];
  }
}

export async function fetchAuditLogsAction(): Promise<AuditLog[]> {
  try {
    const res = await runGraphQLAction(`
      query {
        getAuditLogs {
          id
          userId
          userName
          action
          details
          createdAt
        }
      }
    `);
    return res?.data?.getAuditLogs ?? [];
  } catch (err) {
    console.error('fetchAuditLogsAction error:', err);
    return [];
  }
}

export async function updateTeamMemberProfileAction(
  id: string,
  name: string,
  department: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($id: String!, $name: String!, $department: String!, $title: String!) {
        updateTeamMemberProfile(id: $id, name: $name, department: $department, title: $title) {
          id
          name
          department
          title
        }
      }
    `, { id, name, department, title });
    
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('updateTeamMemberProfileAction error:', err);
    return { success: false, error: err.message || 'Failed to update profile info' };
  }
}
