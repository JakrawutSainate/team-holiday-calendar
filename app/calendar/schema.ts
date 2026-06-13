export interface RequestLeaveInput {
  date: string;
  userName: string;
  type: 'COMPENSATORY_OFF' | 'NORMAL';
  notes?: string;
}

export class CalendarValidator {
  public static validateRequestLeave(input: RequestLeaveInput): string | null {
    if (!input.date) {
      return 'Date is required';
    }
    if (!input.userName.trim()) {
      return 'User name is required';
    }
    return null;
  }
}
