import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

async function loadDotEnvIfNeeded() {
  // Always attempt to load .env and overwrite existing env entries so local .env wins
  const envPath = path.resolve(process.cwd(), ".env");
  try {
    const txt = await fs.readFile(envPath, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2] || "";
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  } catch (err) {
    // ignore if no .env
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = args[i + 1];
      out[key] = val;
      i++;
    }
  }
  return out;
}

async function main() {
  await loadDotEnvIfNeeded();
  const { email, password, name, role, studentId } = parseArgs();
  if (!email || !password || !name) {
    console.error("Usage: npx tsx scripts/create_user.ts --email user@example.com --password secret --name 'Full Name' [--role admin|student] [--studentId S-123]");
    process.exit(1);
  }

  const args = parseArgs();
  let dbUrl = (args.db || args.database_url || process.env.DATABASE_URL) as string | undefined;
  if (!dbUrl) {
    console.error("DATABASE_URL not set. Provide via .env, environment, or --db '<connection string>'");
    process.exit(1);
  }

  // sanitize db URL (trim, remove surrounding <> or quotes)
  dbUrl = dbUrl.trim();
  if (dbUrl.startsWith('<') && dbUrl.endsWith('>')) dbUrl = dbUrl.slice(1, -1);
  if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
    dbUrl = dbUrl.slice(1, -1);
  }
  dbUrl = dbUrl.trim();

  // store plaintext password (per user request). This is INSECURE.
  const hash = password;

  // Construct pg Client with fallback parser if necessary
  let client: Client | undefined;
  try {
    client = new Client({ connectionString: dbUrl });
  } catch (ctorErr) {
    console.error('pg Client constructor failed:', String(ctorErr));
    const uriRegex = /^(?:postgres(?:ql)?:\/\/)?(?:(?<user>[^:@\/]+)(?::(?<pass>[^@\/]*))?@)?(?<host>[^:\/?#]+)(?::(?<port>\d+))?\/(?<db>[^?]+)(?:\?(?<query>.*))?$/i;
    const m = dbUrl.match(uriRegex) as RegExpMatchArray | null;
    if (m && (m as any).groups) {
      const groups = (m as any).groups as Record<string, string>;
      const opts: any = {};
      if (groups.user) opts.user = groups.user;
      if (groups.pass) opts.password = groups.pass;
      if (groups.host) opts.host = groups.host;
      if (groups.port) opts.port = Number(groups.port);
      if (groups.db) opts.database = groups.db;
      if (groups.query && /sslmode=|ssl=true/i.test(groups.query)) {
        opts.ssl = { rejectUnauthorized: false };
      }
      try {
        client = new Client(opts);
        console.log('Using fallback URI parser to construct pg Client');
      } catch (fallbackErr) {
        console.error('Fallback pg Client construction also failed:', String(fallbackErr));
      }
    } else {
      console.error('Fallback parsing failed: connection string did not match expected URI pattern');
    }
  }

  if (!client) {
    console.error('Unable to construct a pg Client from the connection string. Raw:', JSON.stringify(dbUrl));
    process.exit(1);
  }
  try {
    await client.connect();
    const q = `INSERT INTO users (id, email, password, name, role, student_id)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, student_id = EXCLUDED.student_id
      RETURNING id, email, role`;
    const res = await client.query(q, [email, hash, name, role || 'student', studentId || null]);
    console.log('User upserted:', res.rows[0]);
  } catch (err) {
    console.error('Failed to create user:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
