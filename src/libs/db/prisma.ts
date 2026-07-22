import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function makePrismaClient(): PrismaClient {
  const connStr = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]+|['"]+$/g, '');

  if (!connStr) {
    throw new Error(
      'DATABASE_URL is not set. Please configure it in Vercel project settings (Production environment).'
    );
  }

  const pool = new Pool({ connectionString: connStr });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Lazy singleton — only created on first access, never at module-load time.
export function getPrisma(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = makePrismaClient();
  }
  return globalForPrisma._prisma;
}

// Backward-compatible `prisma` export via Proxy
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});
