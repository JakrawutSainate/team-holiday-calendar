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
}

// Mock data has been completely removed to rely on PostgreSQL Database via Go GraphQL API.

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


const API_URL = 'http://localhost:8080/api/v1/graphql';

async function fetchGraphQL(query: string, variables: Record<string, unknown> = {}) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('holidayhq_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }
    return json.data;
  } catch (error) {
    console.error('GraphQL Fetch Error:', error);
    return null;
  }
}

// Actual Database Getters connecting to Go backend
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const data = await fetchGraphQL(`
    query {
      getTeamMembers {
        id
        name
        email
        role
        avatarUrl
        department
        title
        tokensBalance
      }
    }
  `);
  if (data && data.getTeamMembers) {
    return data.getTeamMembers;
  }
  return [];
};

export const getCalendarEvents = async (year: number, month: number): Promise<CalendarEvent[]> => {
  const prefix = `${year}-${month.toString().padStart(2, '0')}`;
  const data = await fetchGraphQL(`
    query {
      getEvents {
        id
        userId
        userName
        date
        status
        details
      }
    }
  `);

  let dbEvents: CalendarEvent[] = [];
  if (data && data.getEvents) {
    dbEvents = data.getEvents.filter((e: CalendarEvent) => e.date.startsWith(prefix));
  }

  // Inject public holidays
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

export const getDayCapacitySetting = async (dateString: string): Promise<CapacitySetting> => {
  // 0. Check if it is a Bank of Thailand holiday
  const isHoliday = botHolidays2026.some(h => h.date === dateString);
  if (isHoliday) {
    return {
      id: `holiday-capacity-${dateString}`,
      date: dateString,
      maxOffAllowed: 0,
      description: 'Bank of Thailand Holiday'
    };
  }

  const data = await fetchGraphQL(`
    query {
      getCapacitySettings {
        id
        date
        dayOfWeek
        maxOffAllowed
        description
      }
    }
  `);

  let settings: CapacitySetting[] = [];
  if (data && data.getCapacitySettings) {
    settings = data.getCapacitySettings;
  }

  const dateObj = new Date(dateString);
  const dayOfWeek = dateObj.getDay();

  // 1. Specific Date override
  const dateOverride = settings.find(s => s.date === dateString);
  if (dateOverride) return dateOverride;

  // 2. Day of Week Pattern override
  const dowOverride = settings.find(s => s.dayOfWeek === dayOfWeek);
  if (dowOverride) return dowOverride;

  // 3. Global default
  const globalDefault = settings.find(s => s.id === 'global-default') || {
    id: 'global-default',
    maxOffAllowed: 2
  };
  return globalDefault;
};

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
