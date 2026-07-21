import { SessionOptions } from 'iron-session';

export interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    department: string;
    title: string;
    tokensBalance: number;
    sickLeaveBalance?: number;
    annualLeaveBalance?: number;
  } | null;
  token: string | null;
}

export const defaultSession: SessionData = {
  user: null,
  token: null,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'holidayhq_session',
  cookieOptions: {
    // secure: true in production, false in development
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
};
