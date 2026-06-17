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

// Mock Team Members matching screens
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'takahashi',
    name: 'Takahashi S.',
    email: 'takahashi.s@holidayhq.com',
    role: 'LEAD',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO',
    department: 'Management',
    title: 'Team Lead',
    tokensBalance: 3
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@holidayhq.com',
    role: 'ADMIN',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAxqpaUNIleLAD9XYhKsX2Qooc6XptE2clDD2Vk35OtdDPrAbhVDtIBD5grW9dmuu0t_0_76tdEww6kzLNxGg1CNiS2NgIYQTICX6W93GldTrIWnWxYJ-qQvE36Q_1xzfyaK-_ioen7Mbpeau6fhmNuVY4v-QQMP6x6YaT12g4TZGfVVmBrEBT_BEadMETd7nN13afYPgbqP4_Zn0c3eLBOGRF__MXE_indHaUYg9RGaFX72v1Cso3YvGiw-J8tEsIVKjxT2ORvKb_',
    department: 'Engineering',
    title: 'Lead Architect',
    tokensBalance: 24
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@holidayhq.com',
    role: 'MEMBER',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS8TddYcJaksvd4bKJzD93hLliZg1S3S2batx0lDbsHqsr1xiFg8FlcuwW6bzJBQ_geod2SW29hTdCFbfVfn0dSG7txCHGHQZCbpCkJHvJenGGch0eWnMZoBKdzzCnamJWTRBHSABWzzZQ5b9-l8XiNx4YXPRDc4En7lhFDAE4uDbQZWZTK7yPKTjIJSeKEU7YK09kBdwXfGYvxs7aHwkOmVySxZyKkkdm5jvLC1ZMWAypdXXdydZc5ak7H-qJTOTztDEY9Sp5DkjO',
    department: 'Engineering',
    title: 'Backend Specialist',
    tokensBalance: 12
  },
  {
    id: 'marcus',
    name: 'Marcus Vane',
    email: 'marcus.vane@holidayhq.com',
    role: 'MEMBER',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBu85XhLTwMEeHO3vAVip9Y-mfe3c3zB3a_t8itTpmQOXqBeOFpGRCDKvneX-oCKjEsTjjtYoP0BHjbbygDGE5010JbGdmLiVMWG6akbNwYNny03AR7Kyqba68WgopU_NTYrOjmnm5rXE94L_8qUPanNxbBO9vtR2QEJAGmLnsIuDPEGfYsA0-a6pKcLWuUenOLb2EhTXC1zFaqCWGG0P3RqD9IFmydnveaILqcpiieMkuGtuj7KVXyS4Iesux6LiywkGnCQBvpe7W_',
    department: 'Engineering',
    title: 'DevOps Lead',
    tokensBalance: 18
  },
  {
    id: 'lena',
    name: 'Lena Muller',
    email: 'lena.muller@holidayhq.com',
    role: 'MEMBER',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxE4SdlJ2CGQnsrHCRCr3QtaBfbOIHh3xWbIahYtfqFcF-l4tZgNb_ExS1YWxTxjJkKRx0wIiobkekXEA9YOPxQV4Ybu3XxprM89ZtNa7C7wxwf0cmc7VQ5qLyUVhkn-hd7xMSDClXORk8ndGrwSzYDhoXQ_dz2rQ3R1Db0o6K364kPgtXgUjVTqMgxZyJD6NaSMsy9bGnZjJP0fjrjRRaSP2Iy586l3fvsw1IlirsU2PwhPE1Rtk1LlQUFmcMqTxjtpzEviGeR1p2',
    department: 'Engineering',
    title: 'QA Engineer',
    tokensBalance: 30
  },
  {
    id: 'jordan',
    name: 'Jordan Lee',
    email: 'jordan.lee@holidayhq.com',
    role: 'ADMIN',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXaS4E-xX4RsuotrjOIfszLucJJyJ7y9VYup_wgC7n-zGGNuKm-S1iZ8PUY7vM3p6kaVxRJQl-e2eUNj68pQJk7WYBZLRHoQDohI-lvpXZyquAC0KP2CffiBhtqnXGtrhRJV2H0_hiRIoAzas-g1_oEYUvTlJFTNA4aAvg_uBEwT76jRVHvfZKacQJ2Mfh30ObG1nSb-oIXr153yHloODybdDHNVFypJUnw39-E1eUWJTDB_VyEkRuDD9llwQM01NIHY2OGccxmM6g',
    department: 'Design',
    title: 'Creative Director',
    tokensBalance: 42
  },
  {
    id: 'sophia',
    name: 'Sophia Kim',
    email: 'sophia.kim@holidayhq.com',
    role: 'MEMBER',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg1kFusWGShxda497lhrmpzDx7Rjhls3X5K3-kALzKtncilmqFqbno74yIMUku2rukk30IasgoXvAYj0JPotW4W96Wr459FGTk9nBlbyQSg0MIJeG5z8CaagBN8dRbRcwuabume43rERNe0nio8Bb63aLQNQWic3R-i59SXdBq0x_rjX70c3LuvqKcMgfoJT64ascPYO6oawcpBIfP5BenLVxfOPEgzUSEsJvsN5XcRxGuRdLuQZnJGKk7SVeJkIwS9ttyCKtna8zt',
    department: 'Design',
    title: 'UI Designer',
    tokensBalance: 8
  },
  {
    id: 'liam',
    name: 'Liam Blake',
    email: 'liam.blake@holidayhq.com',
    role: 'MEMBER',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlsIb0nMFhC2eOgUXErcKoI9oHROD10ZFuVi37kuQyhvqblhE-tG9bQSoAExCCQ0r5uzR_JG9fYHZjywP9EvaWUQVM654Pj-LPKQQN23HYu2eN3UjxmIlCNktoUoLf0ItG4J7EWX2NdQZAMSfp8MEJNFMAV0lIf-uhjwCgDUm9XbSKVlYb7M6qyRgkRgSKYzkbtH7i7VYRZLn69j0STM8Zz23mF_r0ZHgIWDdSz0-ZiRAAUi_Mqt5bKCGXVJGS_wIIhCp7ifyGd9za',
    department: 'Design',
    title: 'Motion Designer',
    tokensBalance: 15
  }
];

// Mock Capacity Settings
export const mockCapacitySettings: CapacitySetting[] = [
  // Default Max Off is 2
  { id: 'global-default', maxOffAllowed: 2, description: 'Global default' },
  // Day of week pattern: Sunday (0) and Saturday (6) allow 0 by default (locked for regular leave, unless weekend shift)
  { id: 'dow-sun', dayOfWeek: 0, maxOffAllowed: 0, description: 'Sundays locked' },
  { id: 'dow-sat', dayOfWeek: 6, maxOffAllowed: 0, description: 'Saturdays locked' },
  // Specific Date override
  { id: 'date-june-25', date: '2026-06-25', maxOffAllowed: 2, description: 'Fully locked testing date' },
  { id: 'date-june-26', date: '2026-06-26', maxOffAllowed: 2, description: 'Fully locked testing date' }
];

// Generate Calendar Events for June 2026
// Saturated dates will be June 4, June 12, June 18, June 25, June 26
const generateMockEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // We need to insert 2 events for June 4, June 12, June 18, June 25, June 26
  const saturatedDays = [4, 12, 18, 25, 26];
  
  saturatedDays.forEach((day, index) => {
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    events.push({
      id: `ev-sat-${day}-1`,
      userId: 'sarah',
      userName: 'Sarah Chen',
      date: dateStr,
      status: 'COMPENSATORY_OFF',
      details: 'Saturated testing event 1'
    });
    events.push({
      id: `ev-sat-${day}-2`,
      userId: 'lena',
      userName: 'Lena Muller',
      date: dateStr,
      status: 'COMPENSATORY_OFF',
      details: 'Saturated testing event 2'
    });
  });

  // Add some other general events
  for (let day = 1; day <= 30; day++) {
    if (saturatedDays.includes(day)) continue;
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    
    // Day % 4 === 0 -> Takahashi off
    if (day % 4 === 0) {
      events.push({
        id: `ev-takahashi-${day}`,
        userId: 'takahashi',
        userName: 'Takahashi S.',
        date: dateStr,
        status: 'COMPENSATORY_OFF',
        details: 'Day off'
      });
    }
    // Day % 5 === 0 -> Alex off
    if (day % 5 === 0) {
      events.push({
        id: `ev-alex-${day}`,
        userId: 'alex',
        userName: 'Alex Rivera',
        date: dateStr,
        status: 'WEEKEND_WORK',
        details: 'Weekend shift coverage'
      });
    }
  }

  return events;
};

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

export const mockCalendarEvents: CalendarEvent[] = generateMockEvents();

// Abstract Asynchronous Getters
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTeamMembers), 50);
  });
};

export const getCalendarEvents = async (year: number, month: number): Promise<CalendarEvent[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter events by year and month
      const prefix = `${year}-${month.toString().padStart(2, '0')}`;
      const filtered = mockCalendarEvents.filter(e => e.date.startsWith(prefix));

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

      resolve([...filtered, ...holidayEvents]);
    }, 50);
  });
};

export const getDayCapacitySetting = async (dateString: string): Promise<CapacitySetting> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 0. Check if it is a Bank of Thailand holiday
      const isHoliday = botHolidays2026.some(h => h.date === dateString);
      if (isHoliday) {
        resolve({
          id: `holiday-capacity-${dateString}`,
          date: dateString,
          maxOffAllowed: 0,
          description: 'Bank of Thailand Holiday'
        });
        return;
      }

      // Resolve limit: Specific Date -> Day-of-Week -> Global Default
      const dateObj = new Date(dateString);
      const dayOfWeek = dateObj.getDay();

      // 1. Specific Date
      const dateOverride = mockCapacitySettings.find(s => s.date === dateString);
      if (dateOverride) {
        resolve(dateOverride);
        return;
      }

      // 2. Day of Week Pattern
      const dowOverride = mockCapacitySettings.find(s => s.dayOfWeek === dayOfWeek);
      if (dowOverride) {
        resolve(dowOverride);
        return;
      }

      // 3. Global default
      const globalDefault = mockCapacitySettings.find(s => s.id === 'global-default') || {
        id: 'fallback-default',
        maxOffAllowed: 2
      };
      resolve(globalDefault);
    }, 50);
  });
};
