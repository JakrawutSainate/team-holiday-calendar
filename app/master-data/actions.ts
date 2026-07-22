'use server';

import { runGraphQLAction, getSession } from '@/src/actions/auth';
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

    const session = await getSession();
    if (session.user && session.user.id === id) {
      session.user.name = name;
      session.user.department = department;
      session.user.title = title;
      await session.save();
    }

    return { success: true };
  } catch (err: any) {
    console.error('updateTeamMemberProfileAction error:', err);
    return { success: false, error: err.message || 'Failed to update profile info' };
  }
}

export interface DepartmentItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface JobTitleItem {
  id: string;
  name: string;
  departmentName: string;
}

export async function fetchDepartmentsAction(): Promise<DepartmentItem[]> {
  try {
    const res = await runGraphQLAction(`
      query {
        getDepartments {
          id
          name
          description
          icon
        }
      }
    `);
    return res?.data?.getDepartments ?? [];
  } catch (err) {
    console.error('fetchDepartmentsAction error:', err);
    return [];
  }
}

export async function createDepartmentAction(name: string, description?: string, icon?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($name: String!, $description: String, $icon: String) {
        createDepartment(name: $name, description: $description, icon: $icon) {
          id
          name
        }
      }
    `, { name, description, icon });
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create department' };
  }
}

export async function updateDepartmentAction(id: string, name: string, description?: string, icon?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($id: String!, $name: String!, $description: String, $icon: String) {
        updateDepartment(id: $id, name: $name, description: $description, icon: $icon) {
          id
          name
        }
      }
    `, { id, name, description, icon });
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update department' };
  }
}

export async function deleteDepartmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($id: String!) {
        deleteDepartment(id: $id)
      }
    `, { id });
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete department' };
  }
}

export async function fetchJobTitlesAction(): Promise<JobTitleItem[]> {
  try {
    const res = await runGraphQLAction(`
      query {
        getJobTitles {
          id
          name
          departmentName
        }
      }
    `);
    return res?.data?.getJobTitles ?? [];
  } catch (err) {
    console.error('fetchJobTitlesAction error:', err);
    return [];
  }
}

export async function createJobTitleAction(name: string, departmentName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($name: String!, $departmentName: String!) {
        createJobTitle(name: $name, departmentName: $departmentName) {
          id
          name
        }
      }
    `, { name, departmentName });
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create job title' };
  }
}

export async function deleteJobTitleAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await runGraphQLAction(`
      mutation($id: String!) {
        deleteJobTitle(id: $id)
      }
    `, { id });
    if (res?.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete job title' };
  }
}
