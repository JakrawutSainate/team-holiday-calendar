export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  title: string;
  tokensBalance: number;
  avatarUrl?: string | null;
  savedSignature?: string | null;
  sickLeaveBalance?: number;
  annualLeaveBalance?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface CapacitySetting {
  id: string;
  date?: string | null;
  dayOfWeek?: number | null;
  maxOffAllowed: number;
  description?: string | null;
}

export interface DepartmentGroup {
  name: string;
  headcount: number;
  titles: string[];
  members: Member[];
}
