# ToolLedger — Equipment Borrowing Management System

This repository contains the ToolLedger app (frontend + backend) used to manage equipment borrowing for students and administrators.

## Required Software
- Visual Studio Code (VSCode)
  - Download: https://code.visualstudio.com/download
- Node.js (v20+)
  - Download: https://nodejs.org/en
  - Verify: `node --version` and `npm --version`
- Git
  - Download: https://git-scm.com/downloads
  - Verify: `git --version`
- PostgreSQL (Neon.cloud recommended)
  - Sign up: https://neon.tech
  - Create a database and copy the `DATABASE_URL` connection string

## Quick setup (recommended for Windows)
1. Open PowerShell in the project root (where `package.json` lives).
2. Run the included setup script which checks prerequisites, installs dependencies, and can create a `.env` file:

```powershell
.\setup.ps1
```

3. When prompted, paste your `DATABASE_URL` (Neon) and optional email SMTP credentials.
4. Optionally allow the script to run the equipment seed and full seeds.
5. Start the development server:

```powershell
npm run dev
```

Open `http://127.0.0.1:5000` in your browser.

## Manual setup (if you prefer)
1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with values similar to:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=you@example.com
EMAIL_PASS=app_password_here
EMAIL_FROM="ToolLedger <you@example.com>"
```

3. Apply database migrations (if using Drizzle migrations):

```bash
npx drizzle-kit push
```

4. Run seeds (optional):

```bash
npx tsx scripts/run_equipment_seed.ts
npx tsx scripts/run_seed.ts
```

5. Start dev server:

```bash
npm run dev
```

## Email Notifications
ToolLedger can send emails via SMTP. Configure email settings in `.env` (see above). For Gmail, create an App Password and use that as `EMAIL_PASS`.

Default sender (if not set in `.env`) is `zandrewijy.tinio@hcdc.edu.ph`.

## Accounts & Testing
- A seeded admin exists: `admin@example.com` (seed password `AdminPass123` by default).
- Create student accounts via the Register page or using the helper script:

```powershell
npx tsx scripts/create_user.ts --email student1@example.com --password Student123 --name "Student One" --role student
```

## Useful scripts
- `npm run dev` — start dev server (Vite + backend)
- `npm run db:push` — push Drizzle schema/migrations
- `npx tsx scripts/run_equipment_seed.ts` — run equipment-only seed
- `npx tsx scripts/run_seed.ts` — run full seed (idempotent)
- `npx tsx scripts/create_user.ts` — upsert a user
- `npx tsx scripts/add_user_columns.ts` — add optional `users` columns required by the current schema (safe to run multiple times)

## Troubleshooting
- If the server reports `DATABASE_URL must be set`, ensure `.env` contains a valid `DATABASE_URL` and restart.
- If email sending fails, check `EMAIL_USER`/`EMAIL_PASS` and use an App Password for Gmail.
- If login/register shows 401 or session issues, ensure cookies are enabled and the server is running at the same host/port.

## Development notes
- Frontend: React + Vite (client in `client/src`)
- Backend: Express + Drizzle ORM (server in `server/`)
- Sessions: `express-session` + `connect-pg-simple`
- Passwords: currently stored plaintext (insecure) — consider re-enabling bcrypt hashing for production

If you want, I can also:
- Add automated Drizzle migrations to the setup script
- Create a test script that sends a sample approval email
- Re-enable secure hashed passwords and migrate users

---
Made to simplify local setup. If you want the script to auto-install additional tools (Chocolatey, PostgreSQL locally, etc.) tell me and I'll extend it.