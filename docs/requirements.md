# HolidayHQ System Requirements

This document details the core requirements and features of the HolidayHQ Team Holiday Calendar System.

---

## 1. Dynamic Capacity Guardrails Engine

To prevent understaffing, the system implements a sequential capacity limit evaluation engine (`Max_Off_Allowed`). For any given calendar date, the number of allowed concurrent leaves is calculated using the following strict override resolution hierarchy:

1. **Specific Date overrides**: If a specific calendar date (e.g., `2026-06-25`) has a configured limit, it takes absolute precedence.
2. **Day-of-Week Pattern overrides**: If no date-specific limit exists, the system checks for day-of-week limits (e.g., all Fridays allow a maximum of 1 team member off).
3. **Global System Default**: If no date-specific or day-of-week pattern override is active, the system falls back to the global capacity default (e.g., maximum of 2 concurrent team members off).

If the current number of approved leaves on a date meets or exceeds the resolved `Max_Off_Allowed` threshold:
- The date cell is visually marked as **"Locked"**.
- Further leave requests for that date are blocked from submission (or queued as pending).

---

## 2. Core Features

### Monthly Calendar View
- 7-column grid layout matching standard calendar weeks (Sunday to Saturday).
- Interactive navigation to toggle between months.
- Real-time display of team members off on each day.
- Visual remaining capacity tracker (e.g., "0/2", "1/2", or "Locked" / "Capacity Reached").

### Holiday Pool Tracking & Tokens
- Users start with a set pool of leave tokens (seeded by default, e.g. 99 tokens for Admins, 0 tokens for Members).
- Weekend / Holiday shift claims accrue **+1.0 token** per shift worked.
- Leave bookings (Compensatory Off) deduct tokens based on the weekday of the leave:
  - **Monday or Friday** leaves (weekend-adjacent): deduct **3.0 tokens** per day.
  - **Tuesday, Wednesday, or Thursday** leaves: deduct **1.0 token** per day.
  - Leaves cannot be requested on weekends (Saturday or Sunday).
- Canceling a leave request refunds the exact amount of tokens that were originally deducted (e.g. 3.0 tokens for Monday/Friday leaves, and 1.0 token for other weekdays).
- Token Redemptions/Rollovers allow users to request payouts of their tokens, which immediately deducts the selected amount from their active balance and logs the transaction.

### Earn Rate Multipliers
- Configurable multipliers for working weekends or public holidays (e.g., 1.5x earn rate).

---

## 3. Export Systems & Collaborative Workflows

### P2P Shift Trading
- Allows team members to request swaps for scheduled coverage shifts.
- Swaps must be validated by the capacity guardrails before manager sign-off.

### Webhook Notifications
- Automated Discord/Line webhooks to broadcast weekly shift schedules, approved leaves, and capacity alerts.

### iCalendar Integration
- Provides a feed URL (`.ics` format) so users can sync their HolidayHQ schedule with external calendars (e.g., Google Calendar, Apple Calendar).
