import { defineConfig } from 'prisma/config';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/^['"]+|['"]+$/g, '');
  }
  try {
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
      const content = fs.readFileSync(backendEnvPath, 'utf8');
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match && match[1]) {
        return match[1].trim().replace(/^['"]+|['"]+$/g, '');
      }
    }
  } catch (_) {}
  return '';
}

export default defineConfig({
  datasource: {
    url: getDatabaseUrl(),
  },
});

