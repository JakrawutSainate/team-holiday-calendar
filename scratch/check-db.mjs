import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connStr = process.env.DATABASE_URL;
console.log('Connecting to DB...');

const pool = new pg.Pool({ connectionString: connStr });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n=== USERS ===');
  const users = await prisma.teamMember.findMany();
  console.log(users.map(u => ({ id: u.id, name: u.name, tokens: u.tokensBalance })));

  console.log('\n=== TOKEN TRANSACTIONS ===');
  const txns = await prisma.tokenTransaction.findMany({
    orderBy: { createdAt: 'asc' }
  });
  console.log(txns);

  console.log('\n=== CALENDAR EVENTS ===');
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' }
  });
  console.log(events);

  console.log('\n=== LEAVE DOCUMENTS ===');
  const docs = await prisma.leaveDocument.findMany({
    orderBy: { leaveDate: 'asc' }
  });
  console.log(docs);
}

main()
  .catch(e => console.error(e))
  .finally(() => pool.end());
