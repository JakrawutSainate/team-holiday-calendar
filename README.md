# 📅 Team Holiday Calendar & Token Management System

A robust and flexible web application designed for teams with non-standard working hours or shift work. It helps manage production/on-call schedules during weekends and automatically tracks compensatory day-off tokens while maintaining team capacity guidelines.

## 🚀 Key Features

### Phase 1: Core & MVP

- **Team Timeline View:** A comprehensive monthly grid showing all team members' schedules at a glance[cite: 2].
- **Automated Token Engine:** Earn +1 token for working on weekends and spend -1 token for taking a compensatory weekday off (prevents negative balances)[cite: 2].
- **Master Data Export:** One-click export of the entire team's monthly schedule to Excel (.xlsx)[cite: 2].

### Phase 2: Collaboration & Guards

- **Dynamic Capacity Control:** Advanced validation logic using `Max_Off_Allowed` variables to limit the number of employees taking leave simultaneously on any given day.
- **Flexible Hierarchy Setup:** Supports global system defaults, weekday/weekend patterns, and specific date overrides (e.g., locking deployment days or opening more slots for holidays).
- **UI/UX Prevention:** Visual indicators showing leave status (e.g., 1/2 slots taken) with color-coded alerts and automated button disabling when quotas are full[cite: 2].
- **Audit Logs & Notifications:** Full history logging for manual changes and instant updates via Line Notify / Discord Webhooks[cite: 2].

### Phase 3: Advanced Options

- **P2P Shift Trading:** Peer-to-peer requests for swapping shifts, requiring mutual confirmation[cite: 2].
- **Calendar Synchronization:** Generate unique iCalendar (.ics) feeds for seamless integration with Google Calendar and Apple Calendar[cite: 2].
- **Analytics Dashboard:** Annual stats and visual insights into team token usage and workload distribution[cite: 2].

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI / FullCalendar
- **Backend:** Node.js, Next.js Server Actions / NestJS
- **Database & ORM:** PostgreSQL / MySQL, Prisma ORM[cite: 2]
- **Libraries:** ExcelJS (for report generation), WeasyPrint (for documentation formatting)[cite: 1, 2]

## 🗄️ Database Schema Overview

The core architecture relies on a highly scalable data model[cite: 2]:

- `User`: Handles accounts and roles (Admin/Member)[cite: 2].
- `HolidayQuota`: Tracks current available day-off tokens[cite: 2].
- `CalendarEvent`: Records individual daily status (Work, Weekend Work, Leave)[cite: 2].
- `CapacitySetting`: Manages dynamic override rules per date or day-of-week.
- `AuditLog` & `SwapRequest`: Tracks system history and peer trades[cite: 2].

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
