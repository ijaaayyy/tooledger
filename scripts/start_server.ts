import fs from 'fs/promises';
import path from 'path';

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
  } catch (err) {
    // ignore
  }
}

async function main() {
  await loadEnv();
  // import the server entrypoint which will start listening
  await import('../server/index');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
