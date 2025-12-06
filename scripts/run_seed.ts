import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

async function loadDotEnvIfNeeded() {
  // Always attempt to load .env and overwrite existing env entries so that local
  // .env file values take precedence for debugging and local runs.
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

async function main() {
  await loadDotEnvIfNeeded();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Set it in the environment or in .env.");
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

  const seedPath = path.resolve(process.cwd(), "seeds", "postgres_seed.sql");
  let sql: string;
  try {
    sql = await fs.readFile(seedPath, "utf8");
  } catch (err) {
    console.error(`Could not read seed file at ${seedPath}:`, err);
    process.exit(1);
  }

  // Construct pg Client; if pg's URL parser throws, attempt a tolerant fallback.
  let client: Client | undefined;
  try {
    client = new Client({ connectionString: conn });
  } catch (ctorErr) {
    console.error('pg Client constructor failed:', String(ctorErr));
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
    console.error('Unable to construct a pg Client from the connection string. Raw:', JSON.stringify(connectionString));
    process.exit(1);
  }
  try {
    await client.connect();
    console.log("Connected to database. Running seed SQL...");
    await client.query("BEGIN");
    // send the entire SQL file in one request; Postgres accepts multiple statements
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Seed applied successfully.");
  } catch (err) {
    console.error("Error applying seed:", err);
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
