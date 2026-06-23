export type Role = 'ADMIN' | 'MEMBER' | 'LEAD';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department: 'Engineering' | 'Design' | 'Management';
  title: string;
  tokensBalance: number;
}

export type CalendarEventStatus = 'NORMAL' | 'WEEKEND_WORK' | 'COMPENSATORY_OFF' | 'PUBLIC_HOLIDAY' | 'HOLIDAY_WORK';

export interface CalendarEvent {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  status: CalendarEventStatus;
  details?: string;
}

export interface CapacitySetting {
  id: string;
  date?: string; // Specific overrides: 'YYYY-MM-DD'
  dayOfWeek?: number; // Day-of-Week Pattern overrides: 0 = Sun, 1 = Mon, ...
  maxOffAllowed: number;
  description?: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  priority?: string;
  meta?: string;
}

export interface Transaction {
  date: string;
  type: 'EARN' | 'SPEND';
  description: string;
  status: string;
  amount: string;
  relatedDate?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'SPEND';
  amount: number;
  description: string;
  relatedDate?: string;
  createdAt: string;
}

export interface BOHoliday {
  date: string;
  nameEn: string;
  nameTh: string;
}

export const botHolidays2026: BOHoliday[] = [
  { date: '2026-01-01', nameEn: "New Year's Day", nameTh: 'วันขึ้นปีใหม่' },
  { date: '2026-01-02', nameEn: 'Additional special holiday', nameTh: 'วันหยุดพิเศษเพิ่มเติม' },
  { date: '2026-03-03', nameEn: 'Makha Bucha Day', nameTh: 'วันมาฆบูชา' },
  { date: '2026-04-06', nameEn: 'Chakri Memorial Day', nameTh: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  { date: '2026-04-13', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-04-14', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-04-15', nameEn: 'Songkran Festival', nameTh: 'วันสงกรานต์' },
  { date: '2026-05-01', nameEn: 'National Labour Day', nameTh: 'วันแรงงานแห่งชาติ' },
  { date: '2026-05-04', nameEn: 'Coronation Day', nameTh: 'วันฉัตรมงคล' },
  { date: '2026-06-01', nameEn: 'Substitution for Visakha Bucha Day', nameTh: 'วันหยุดชดเชยวันวิสาขบูชา' },
  { date: '2026-06-03', nameEn: "H.M. Queen Suthida Bajrasudhabimalalakshana's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { date: '2026-07-28', nameEn: "H.M. King Maha Vajiralongkorn's Birthday", nameTh: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว' },
  { date: '2026-07-29', nameEn: 'Asarnha Bucha Day', nameTh: 'วันอาสาฬหบูชา' },
  { date: '2026-08-12', nameEn: "H.M. Queen Sirikit The Queen Mother's Birthday / Mother's Day", nameTh: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวงและวันแม่แห่งชาติ' },
  { date: '2026-10-13', nameEn: "H.M. King Bhumibol Adulyadej The Great Memorial Day", nameTh: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร' },
  { date: '2026-10-16', nameEn: 'Additional special holiday (Bangkok only)', nameTh: 'วันหยุดพิเศษเพิ่มเติม (เฉพาะกรุงเทพมหานคร)' },
  { date: '2026-10-23', nameEn: "H.M. King Chulalongkorn the Great Memorial Day", nameTh: 'วันปิยมหาราช' },
  { date: '2026-12-07', nameEn: "Substitution for H.M. King Bhumibol Adulyadej's Birthday, National Day, and Father's Day", nameTh: 'วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร วันชาติ และวันพ่อแห่งชาติ' },
  { date: '2026-12-10', nameEn: 'Constitution Day', nameTh: 'วันรัฐธรรมนูญ' },
  { date: '2026-12-31', nameEn: "New Year's Eve", nameTh: 'วันสิ้นปี' }
];


import { runGraphQLAction } from '@/src/actions/auth';

async function fetchGraphQL(query: string, variables: Record<string, unknown> = {}) {
  try {
    const json = await runGraphQLAction(query, variables);
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }
    return json.data;
  } catch (error) {
    console.error('GraphQL Fetch Error:', error);
    return null;
  }
}

// ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const data = await fetchGraphQL(`
    query {
      getTeamMembers {
        id name email role avatarUrl department title tokensBalance
      }
    }
  `);
  return data?.getTeamMembers ?? [];
};

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

export const getCalendarEvents = async (year: number, month: number): Promise<CalendarEvent[]> => {
  const prefix = `${year}-${month.toString().padStart(2, '0')}`;
  const data = await fetchGraphQL(`
    query {
      getEvents {
        id userId userName date status details
      }
    }
  `);

  let dbEvents: CalendarEvent[] = [];
  if (data?.getEvents) {
    dbEvents = data.getEvents.filter((e: CalendarEvent) => e.date.startsWith(prefix));
  }

  // Inject public holidays as synthetic events
  const monthHolidays = botHolidays2026.filter(h => h.date.startsWith(prefix));
  const holidayEvents: CalendarEvent[] = monthHolidays.map((h, i) => ({
    id: `holiday-${h.date}-${i}`,
    userId: 'system-holiday',
    userName: 'Holiday',
    date: h.date,
    status: 'PUBLIC_HOLIDAY',
    details: JSON.stringify({ en: h.nameEn, th: h.nameTh })
  }));

  return [...dbEvents, ...holidayEvents];
};

// ─── CAPACITY SETTINGS ────────────────────────────────────────────────────────

/** Fetch ALL capacity settings in one round-trip */
export const getAllCapacitySettings = async (): Promise<CapacitySetting[]> => {
  const data = await fetchGraphQL(`
    query {
      getCapacitySettings {
        id date dayOfWeek maxOffAllowed description
      }
    }
  `);
  return data?.getCapacitySettings ?? [];
};

/**
 * Resolve the capacity limit for a given date using already-fetched settings.
 * Pass the result of getAllCapacitySettings() to avoid repeated network calls.
 */
export const resolveCapacity = (dateString: string, settings: CapacitySetting[]): CapacitySetting => {
  // BOT holiday → 0 off allowed
  const isHoliday = botHolidays2026.some(h => h.date === dateString);
  if (isHoliday) {
    return { id: `holiday-capacity-${dateString}`, date: dateString, maxOffAllowed: 0, description: 'Bank of Thailand Holiday' };
  }

  const dayOfWeek = new Date(dateString).getDay();

  // Priority 1: specific date override
  const dateOverride = settings.find(s => s.date === dateString);
  if (dateOverride) return dateOverride;

  // Priority 2: day-of-week override
  const dowOverride = settings.find(s => s.dayOfWeek === dayOfWeek);
  if (dowOverride) return dowOverride;

  // Priority 3: global default
  return settings.find(s => s.id === 'global-default') ?? { id: 'global-default', maxOffAllowed: 2 };
};

/** Single-date capacity lookup (kept for backwards compat, fetches all settings internally) */
export const getDayCapacitySetting = async (dateString: string): Promise<CapacitySetting> => {
  const settings = await getAllCapacitySettings();
  return resolveCapacity(dateString, settings);
};

// ─── TOKEN TRANSACTIONS ───────────────────────────────────────────────────────

export const getTokenTransactions = async (): Promise<TokenTransaction[]> => {
  const data = await fetchGraphQL(`
    query {
      getTokenTransactions {
        id userId type amount description relatedDate createdAt
      }
    }
  `);
  return data?.getTokenTransactions ?? [];
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const claimShiftMutation = async (date: string, status: string, details: string) => {
  return await fetchGraphQL(`
    mutation claimShift($date: String!, $status: String!, $details: String) {
      claimShift(date: $date, status: $status, details: $details) {
        id
      }
    }
  `, { date, status, details });
};

export const requestLeaveMutation = async (date: string) => {
  return await fetchGraphQL(`
    mutation requestLeave($date: String!) {
      requestLeave(date: $date) {
        id
      }
    }
  `, { date });
};

export const cancelLeaveMutation = async (id: string) => {
  return await fetchGraphQL(`
    mutation cancelLeave($id: String!) {
      cancelLeave(id: $id)
    }
  `, { id });
};

export const updateMaxOffAllowedMutation = async (maxOffAllowed: number) => {
  return await fetchGraphQL(`
    mutation updateMaxOffAllowed($maxOffAllowed: Float!) {
      updateMaxOffAllowed(maxOffAllowed: $maxOffAllowed) {
        id
      }
    }
  `, { maxOffAllowed });
};
