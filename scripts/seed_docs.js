const fs = require('fs');
const path = require('path');

async function seed() {
  const jsonPath = path.join(__dirname, '..', 'docs', 'weekend_tasks_db_format (1).json');
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Loaded ${rawData.length} entries from JSON.`);

  // 1. Fetch team members
  const resMembers = await fetch('https://api-team-holiday-calendar.vercel.app/api/v1/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query { getTeamMembers { id name role email tokensBalance } }' }),
  });
  const jsonMembers = await resMembers.json();
  const members = jsonMembers?.data?.getTeamMembers || [];

  console.log('Found team members:', members.map(m => `${m.name} (${m.id})`));

  if (members.length === 0) {
    console.error('No team members found.');
    return;
  }

  // Deduplicate entries by date
  const byDate = new Map();
  for (const r of rawData) {
    const status = r.is_public_holiday ? 'HOLIDAY_WORK' : 'WEEKEND_WORK';
    if (!byDate.has(r.date)) {
      byDate.set(r.date, { date: r.date, status, projects: [r.project], summary: r.summary });
    } else {
      const existing = byDate.get(r.date);
      if (!existing.projects.includes(r.project)) existing.projects.push(r.project);
      existing.summary = existing.summary + ' | ' + r.summary;
    }
  }

  const entriesToSeed = Array.from(byDate.values()).map(e => ({
    date: e.date,
    status: e.status,
    details: `[${e.projects.join(', ')}] ${e.summary}`.slice(0, 500),
  }));

  console.log(`Prepared ${entriesToSeed.length} deduplicated entries for seeding.`);

  // Seed entries for all members
  for (const member of members) {
    console.log(`Seeding entries for ${member.name} (${member.id})...`);

    const mutationRes = await fetch('https://api-team-holiday-calendar.vercel.app/api/v1/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation adminBulkClaimTokens($userId: String!, $entries: [BulkClaimEntry!]!) {
            adminBulkClaimTokens(userId: $userId, entries: $entries) { claimed skipped }
          }
        `,
        variables: {
          userId: member.id,
          entries: entriesToSeed,
        },
      }),
    });

    const result = await mutationRes.json();
    console.log(`Result for ${member.name}:`, JSON.stringify(result));
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
