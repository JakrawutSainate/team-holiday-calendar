import { sanitize } from '@/src/libs/security';

export interface RequestLeaveInput {
  date: string;
  userName: string;
  type: 'COMPENSATORY_OFF' | 'NORMAL';
  notes: string;
}

export class CalendarValidator {
  public static validateRequestLeave(input: RequestLeaveInput): string {
    const date = sanitize(input.date);
    const userName = sanitize(input.userName);

    if (!date) {
      return 'Date is required';
    }
    if (!userName.trim()) {
      return 'User name is required';
    }
    return '';
  }
}
