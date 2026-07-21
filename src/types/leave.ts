export interface LeaveStats {
  taken: number;
  current: number;
  total: number;
}

export interface LeaveFormData {
  writtenAt: string;
  formDate: string;
  recipientTitle: string;
  fullName: string;
  position: string;
  level: string;
  department: string;
  leaveType: 'SICK' | 'PERSONAL' | 'MATERNITY';
  reasonText: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  contactAddress: string;
  contactPhone: string;
  stats?: {
    sick: LeaveStats;
    personal: LeaveStats;
    maternity: LeaveStats;
  };
}
