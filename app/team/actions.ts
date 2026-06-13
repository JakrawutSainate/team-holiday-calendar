'use server';

import { TeamValidator, InviteMemberInput } from './schema';

export async function inviteMemberAction(input: InviteMemberInput) {
  const error = TeamValidator.validateInvite(input);
  if (error) {
    return { success: false, error };
  }

  console.log('Member invited on server:', input);
  return { success: true };
}

export async function downloadTeamReportAction() {
  console.log('Generating team directory report...');
  return { success: true, downloadUrl: '/reports/team-directory-2026.pdf' };
}
