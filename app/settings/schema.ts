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
  public static validateProfile(input: ProfileSettingsInput): string | null {
    if (!input.fullName.trim()) {
      return 'Full name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.emailAddress)) {
      return 'Invalid email address';
    }
    return null;
  }

  public static validateWorkspace(input: WorkspaceSettingsInput): string | null {
    if (input.capacity < 0 || input.capacity > 100) {
      return 'Capacity must be between 0 and 100';
    }
    return null;
  }
}
