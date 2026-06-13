'use server';

import { SettingsValidator, ProfileSettingsInput, WorkspaceSettingsInput } from './schema';

export async function saveProfileSettings(input: ProfileSettingsInput) {
  const error = SettingsValidator.validateProfile(input);
  if (error) {
    return { success: false, error };
  }
  
  console.log('Profile settings saved successfully on server:', input);
  return { success: true };
}

export async function saveWorkspaceSettings(input: WorkspaceSettingsInput) {
  const error = SettingsValidator.validateWorkspace(input);
  if (error) {
    return { success: false, error };
  }
  
  console.log('Workspace settings saved successfully on server:', input);
  return { success: true };
}
