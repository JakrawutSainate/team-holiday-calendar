'use server';

import { SettingsValidator, ProfileSettingsInput, WorkspaceSettingsInput } from './schema';
import { sanitize } from '@/src/libs/security';
import { runGraphQLAction, getSession } from '@/src/actions/auth';

export async function saveProfileSettings(input: ProfileSettingsInput) {
  const sanitizedInput: ProfileSettingsInput = {
    fullName: sanitize(input.fullName),
    emailAddress: sanitize(input.emailAddress)
  };
  const error = SettingsValidator.validateProfile(sanitizedInput);
  if (error !== '') {
    return { success: false, error };
  }
  
  console.log('Profile settings saved successfully on server:', sanitizedInput);
  return { success: true, error: '' };
}

export async function saveWorkspaceSettings(input: WorkspaceSettingsInput) {
  const sanitizedInput: WorkspaceSettingsInput = {
    capacity: Number(input.capacity),
    earnRate: sanitize(input.earnRate)
  };
  const error = SettingsValidator.validateWorkspace(sanitizedInput);
  if (error !== '') {
    return { success: false, error };
  }
  
  console.log('Workspace settings saved successfully on server:', sanitizedInput);
  return { success: true, error: '' };
}

export async function saveSignatureAction(signature: string | null) {
  try {
    const query = `
      mutation ($signature: String) {
        updateProfileSignature(signature: $signature) {
          id
          savedSignature
        }
      }
    `;
    const res = await runGraphQLAction(query, { signature });
    if (res?.errors) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save signature' };
  }
}

export async function getUserSavedSignatureAction(): Promise<string | null> {
  try {
    const session = await getSession();
    if (!session.user) return null;

    const res = await runGraphQLAction(`
      query {
        getTeamMembers {
          id
          savedSignature
        }
      }
    `);
    const members = res?.data?.getTeamMembers || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = members.find((m: any) => m.id === session.user?.id);
    return current?.savedSignature ?? null;
  } catch (err) {
    console.error('getUserSavedSignatureAction error:', err);
    return null;
  }
}
