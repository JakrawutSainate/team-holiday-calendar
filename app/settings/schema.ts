import { sanitize } from '@/src/libs/security';

export interface ProfileSettingsInput {
  fullName: string;
  emailAddress: string;
}

export interface WorkspaceSettingsInput {
  capacity: number;
  earnRate: string;
}

export interface NotificationSettingsInput {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export class SettingsValidator {
  public static validateProfile(input: ProfileSettingsInput): string {
    const fullName = sanitize(input.fullName);
    const emailAddress = sanitize(input.emailAddress);

    if (!fullName.trim()) {
      return 'Full name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return 'Invalid email address';
    }
    return '';
  }

  public static validateWorkspace(input: WorkspaceSettingsInput): string {
    if (input.capacity < 0 || input.capacity > 100) {
      return 'Capacity must be between 0 and 100';
    }
    return '';
  }
}
