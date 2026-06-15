import { sanitize } from '@/src/libs/security';

export interface InviteMemberInput {
  name: string;
  email: string;
  role: 'MEMBER' | 'LEAD' | 'ADMIN';
  department: 'Engineering' | 'Design' | 'Management';
  title: string;
}

export class TeamValidator {
  public static validateInvite(input: InviteMemberInput): string | undefined {
    const name = sanitize(input.name);
    const email = sanitize(input.email);
    const title = sanitize(input.title);

    if (!name.trim()) {
      return 'Name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email address';
    }
    if (!title.trim()) {
      return 'Job title is required';
    }
    return undefined;
  }
}
