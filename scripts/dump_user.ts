import fs from 'fs/promises';
import path from 'path';
import { Client } from 'pg';

async function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    const txt = await fs.readFile(envPath, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2] || '';
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  } catch (err) {}
}

async function main() {
  await loadEnv();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT id, email, password, role FROM users WHERE email = $1", ['admin@example.com']);
  console.log('rows:', res.rows);
  await client.end();
}

main().catch(e=>{console.error(e);process.exit(1);});
