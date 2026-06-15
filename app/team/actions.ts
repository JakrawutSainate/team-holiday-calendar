'use server';

import { TeamValidator, InviteMemberInput } from './schema';
import { sanitize } from '@/src/libs/security';

export async function inviteMemberAction(input: InviteMemberInput) {
  const sanitizedInput: InviteMemberInput = {
    name: sanitize(input.name),
    email: sanitize(input.email),
    role: input.role,
    department: input.department,
    title: sanitize(input.title)
  };
  const error = TeamValidator.validateInvite(sanitizedInput);
  if (error) {
    return { success: false, error };
  }

  console.log('Member invited on server:', sanitizedInput);
  return { success: true };
}

export async function downloadTeamReportAction() {
  console.log('Generating team directory report...');
  return { success: true, downloadUrl: '/reports/team-directory-2026.pdf' };
}
