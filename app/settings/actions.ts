'use server';

import { SettingsValidator, ProfileSettingsInput, WorkspaceSettingsInput } from './schema';
import { sanitize } from '@/src/libs/security';

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
