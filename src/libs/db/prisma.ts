import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

import { Pool } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function makePrismaClient() {
  let connStr = process.env.DATABASE_URL || '';
  // Clean surrounding quotes or whitespace if present
  connStr = connStr.trim().replace(/^["']|["']$/g, '');

  if (!connStr) {
    console.warn('DATABASE_URL is missing in process.env.');
    return new PrismaClient();
  }

  // Remove channel_binding which can break Neon serverless Pool parsing
  const sanitizedStr = connStr
    .replace(/&channel_binding=[^&]*/g, '')
    .replace(/\?channel_binding=[^&]*&?/g, '?')
    .replace(/\?$/, '');

  try {
    const neonPool = new Pool({ connectionString: sanitizedStr });
    const adapter = new PrismaNeon(neonPool as any);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.warn('Failed to initialize PrismaNeon adapter, using default PrismaClient:', err);
    return new PrismaClient();
  }
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
