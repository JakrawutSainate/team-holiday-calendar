import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

import { Pool } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function makePrismaClient() {
  let connStr = process.env.DATABASE_URL;
  if (!connStr) {
    throw new Error('DATABASE_URL is not set. Cannot connect to database.');
  }
  // Sanitize connection string for @neondatabase/serverless Pool
  connStr = connStr.replace(/&channel_binding=[^&]*/g, '').replace(/\?channel_binding=[^&]*&?/g, '?');
  const neonPool = new Pool({ connectionString: connStr });
  const adapter = new PrismaNeon(neonPool as any);
  return new PrismaClient({ adapter });
}

// Lazy singleton — only created on first access, never at module-load time.
export function getPrisma(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = makePrismaClient();
  }
  return globalForPrisma._prisma;
}

// Keep a backward-compatible `prisma` export but make it a Proxy so
// the actual client is only constructed the first time a property is accessed.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});
