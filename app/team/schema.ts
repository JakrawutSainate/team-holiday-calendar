export interface InviteMemberInput {
  name: string;
  email: string;
  role: 'MEMBER' | 'LEAD' | 'ADMIN';
  department: 'Engineering' | 'Design' | 'Management';
  title: string;
}

export class TeamValidator {
  public static validateInvite(input: InviteMemberInput): string | null {
    if (!input.name.trim()) {
      return 'Name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return 'Invalid email address';
    }
    if (!input.title.trim()) {
      return 'Job title is required';
    }
    return null;
  }
}
