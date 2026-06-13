import { Activity } from '@/src/libs/models/HolidayHQManager';

export interface UpcomingHoliday {
  name: string;
  avatar: string;
  detail: string;
}

export interface OverviewData {
  activities: Activity[];
  presentCount: number;
  availabilityPercent: number;
  burnoutRisk: number[];
}
