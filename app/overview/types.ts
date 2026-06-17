import { Activity } from '@/src/libs/calendarData';

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
