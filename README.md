# PMF System

A ready-to-run Performance Management Form web app.

## Stack
- Next.js 14 (App Router, TypeScript)
- Prisma ORM + SQLite (zero-config — upgrade to Postgres by changing `DATABASE_URL` and `provider`)
- NextAuth (credentials + JWT)
- Tailwind CSS

## Getting started

```bash
cd pmf-app
npm install
npm run db:setup     # creates SQLite DB, runs migrations, seeds demo data
npm run dev
```

Open http://localhost:3000 and sign in with any demo account:

| Role         | Email                         | Password      |
|--------------|-------------------------------|---------------|
| HR Admin     | hr@company.com                | password123   |
| Manager      | manager@company.com           | password123   |
| Employee     | employee@company.com          | password123   |
| Probationary | probationary@company.com      | password123   |

## What works
- Role-based dashboards (HR / Manager / Employee)
- Two seeded PMF templates: **Regular** (from Krystle's PMF) and **Probationary** (from Janella's PMF)
- Full evaluation workflow: `SELF_ASSESS → MANAGER_REVIEW → HR_REVIEW → FINALIZED` with reopen
- Role-scoped access (employees see only their own; managers see only direct reports; HR sees all)
- Side-by-side view of Employee / Manager / HR responses once later stages begin
- Auto-computed weighted overall score on manager submit
- Audit log of all transitions and response saves
- Admin panel: users, cycles, audit log
- Templates page (read-only UI; edit via `npm run db:studio`)

## Production hardening checklist
- Swap SQLite → Postgres: set `DATABASE_URL` and change `provider = "postgresql"` in `prisma/schema.prisma`
- Rotate `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- Add TLS at the reverse proxy
- Enable MFA (e.g. `@simplewebauthn/server` or TOTP)
- Wire SSO via `next-auth` providers (Azure AD / Okta / Google)
- Encrypt free-text comments at rest with pgcrypto
- Set CSP / HSTS headers via `next.config.js`
- Add rate limiting (e.g. `@upstash/ratelimit` + Redis)
- Send notifications: integrate SES/Resend in a `lib/notifications.ts`

## Useful commands
```bash
npm run db:studio   # open Prisma Studio to inspect / edit data
npm run db:reset    # wipe & reseed
```

## Project layout
```
prisma/                    schema + seed
src/app/                   Next.js pages
  login/                   sign-in page
  (app)/dashboard/         role-aware dashboard
  (app)/assignments/[id]/  evaluation form
  (app)/templates/         template list (HR)
  (app)/admin/             users, cycles, audit log (HR)
  api/auth/[...nextauth]/  NextAuth route
  api/assignments/[id]/    response save + state transitions
src/lib/                   db, auth, rbac helpers
src/components/            shared React components
```
