import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    if (fs.existsSync(envPath)) {
      const txt = fs.readFileSync(envPath, 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
        if (!m) continue;
        const k = m[1];
        let v = m[2] || '';
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
        process.env[k] = v;
      }
    }
  } catch (e) {
    // ignore
  }
}

async function main() {
  loadEnv();
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const seedPath = path.resolve(process.cwd(), 'seeds', 'equipment_seed.sql');
  let sql = '';
  try {
    sql = fs.readFileSync(seedPath, 'utf8');
  } catch (e) {
    console.error('Could not read equipment seed:', e);
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB, running equipment seed...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Equipment seed applied.');
  } catch (e) {
    console.error('Failed to apply equipment seed:', e);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch(e=>{console.error(e);process.exit(1)});
