/*
  Script: add_user_columns.ts
  Purpose: Ensure `users` table has optional columns added by the current schema
           (last_login, last_login_ip, last_user_agent). Run with:

    npx tsx scripts/add_user_columns.ts

*/
import path from "path";
import fs from "fs";
import { pool } from "../server/db";

async function main() {
  try {
    const sql = `ALTER TABLE IF EXISTS users
      ADD COLUMN IF NOT EXISTS last_login timestamp,
      ADD COLUMN IF NOT EXISTS last_login_ip text,
      ADD COLUMN IF NOT EXISTS last_user_agent text;`;

    console.log("Applying user columns migration...");
    const res = await pool.query(sql);
    console.log("Migration completed.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(2);
  }
}

main();
