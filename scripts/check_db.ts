import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

async function loadDotEnvIfNeeded() {
  // Prefer `.env` file values for local debugging: always attempt to load and override
  // existing process.env entries when a .env file is present. This avoids cases where
  // the shell session contains a redacted/old `DATABASE_URL`.
  const envPath = path.resolve(process.cwd(), ".env");
  try {
    const txt = await fs.readFile(envPath, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2] || "";
      if ((v.startsWith("\'") && v.endsWith("\'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      // overwrite any existing value with the .env value to ensure local file wins
      process.env[k] = v;
    }
  } catch (err) {
    // ignore
  }
}

async function main() {
  await loadDotEnvIfNeeded();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  // sanitize connection string: trim and strip surrounding <> or quotes
  let conn = connectionString.trim();
  if (conn.startsWith('<') && conn.endsWith('>')) conn = conn.slice(1, -1);
  if ((conn.startsWith('"') && conn.endsWith('"')) || (conn.startsWith("'") && conn.endsWith("'"))) {
    conn = conn.slice(1, -1);
  }
  conn = conn.trim();
  console.log('DB URL preview:', conn.length > 60 ? conn.slice(0, 60) + '...' : conn);

  let client: Client | undefined;
  // Try the normal constructor first and fall back to a tolerant parser when pg's parser fails.
  try {
    client = new Client({ connectionString: conn });
  } catch (ctorErr) {
    console.error('pg Client constructor failed:', String(ctorErr));
    // Fallback: try to parse a simple postgres URI ourselves
    // Example URI: postgres://user:pass@host:5432/dbname?sslmode=require
    const uriRegex = /^(?:postgres(?:ql)?:\/\/)?(?:(?<user>[^:@\/]+)(?::(?<pass>[^@\/]*))?@)?(?<host>[^:\/?#]+)(?::(?<port>\d+))?\/(?<db>[^?]+)(?:\?(?<query>.*))?$/i;
    const m = conn.match(uriRegex) as RegExpMatchArray | null;
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
    // Provide helpful diagnostics for debugging malformed connection strings.
    console.error('Unable to construct a pg Client from the connection string. Dumping debug info:');
    console.error('Raw connection string:', JSON.stringify(connectionString));
    console.error('Sanitized preview:', conn.length > 240 ? conn.slice(0, 240) + '...' : conn);
    const chars = Array.from(conn.slice(0, 200)).map((c) => c.charCodeAt(0));
    console.error('First 200 char codes:', chars);
    process.exit(1);
  }

  try {
    await client.connect();
    const res = await client.query('SELECT 1 AS ok');
    console.log('DB connection OK:', res.rows[0]);
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch (endErr) {
      // ignore
    }
  }
}

main();
