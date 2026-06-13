# HolidayHQ System Architecture

This document blueprints the file structure, route maps, and data schemas for HolidayHQ.

---

## 1. Route Map

The application is structured using Next.js App Router. The primary routes are mapped as follows:

| Route Path | File Location | Purpose |
| :--- | :--- | :--- |
| `/overview` | `src/app/overview/page.tsx` | Bento box dashboard summarizing metrics, upcoming leaves, and active pulse. |
| `/calendar` | `src/app/calendar/page.tsx` | Main calendar grid view displaying team schedules and capacity locks. |
| `/balance` | `src/app/balance/page.tsx` | Token transaction ledger showing earn/spend events and details. |
| `/team` | `src/app/team/page.tsx` | Team directory organized by department, searchable by member. |
| `/settings` | `src/app/settings/page.tsx` | Profile and workspace configuration console. |

---

## 2. Object Models & Schema Layout

### User
Represents a team member inside the organization.
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'LEAD';
  avatarUrl?: string;
  department: 'Engineering' | 'Design' | 'Management';
  title: string;
  tokensBalance: number;
}
```

### HolidayQuota
Tracks personal holiday allocation and usage statistics.
```typescript
interface HolidayQuota {
  userId: string;
  totalAllocated: number;
  tokensEarned: number;
  tokensSpent: number;
  carryOver: number;
  year: number;
}
```

### CalendarEvent
Represents a block of time where a user works or takes off.
```typescript
interface CalendarEvent {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  status: 'NORMAL' | 'WEEKEND_WORK' | 'COMPENSATORY_OFF' | 'PUBLIC_HOLIDAY';
  details?: string;
}
```

### CapacitySetting
Configures the limits of concurrent leaves.
```typescript
interface CapacitySetting {
  id: string;
  date?: string; // e.g., '2026-06-25' (Specific override)
  dayOfWeek?: number; // 0 = Sun, 1 = Mon, ... (Day-of-Week Pattern override)
  maxOffAllowed: number; // resolved limit
  description?: string;
}
```

### AuditLog
Tracks historical changes for token adjustments, policy changes, and leave requests.
```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  actorId: string;
  action: 'EARN_TOKEN' | 'SPEND_TOKEN' | 'POLICY_CHANGE' | 'LEAVE_REQUEST';
  details: string;
}
```
