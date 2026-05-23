# 🚀 Deploy PMF System to Vercel (free)

Total time: ~15 minutes. You'll get a public URL like `https://sevengen-pmf.vercel.app`.

## Part 1 · Create a free cloud database (Neon)

1. Go to **https://neon.tech** and sign up (Google login is fastest)
2. Create a new project:
   - Name: `sevengen-pmf`
   - Region: pick the closest to the Philippines (e.g. Singapore / Hong Kong)
3. On the project dashboard, find the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy it — you'll need it in the next step.

## Part 2 · Switch the app from SQLite to Postgres

1. Open `prisma\schema.prisma` in VS Code or Notepad. Find this block near the top:
   ```
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   Change `"sqlite"` → `"postgresql"` and save.

2. Open `.env`. Replace the `DATABASE_URL` line with your Neon URL, keeping the quotes:
   ```
   DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"
   ```

3. Delete the `prisma\migrations` folder (it was built for SQLite).

4. In a terminal:
   ```bash
   cd "C:\Users\Kat\OneDrive\PMF AUTOMATION\pmf-app"
   set PATH=C:\Users\Kat\node-v20.18.0-win-x64;%PATH%
   npx prisma migrate dev --name init
   npm run db:seed
   ```
   This creates all the tables in Neon and loads the demo data.

5. Test it works: `npm run dev` → open http://localhost:3000 → sign in. If login works, you're good.

## Part 3 · Create a Vercel account + deploy

1. Go to **https://vercel.com/signup** and sign up (free tier)
2. In your terminal (still in the `pmf-app` folder):
   ```bash
   npx vercel login
   ```
   Follow the browser link to authenticate.
3. Deploy:
   ```bash
   npx vercel
   ```
   Answer the prompts:
   - Set up and deploy? **Y**
   - Which scope? *(your personal account)*
   - Link to existing project? **N**
   - Project name? **sevengen-pmf** (or anything)
   - In which directory is your code? **./**
   - Modify settings? **N**

4. Wait ~2 minutes. You'll see a preview URL printed.

## Part 4 · Set environment variables in Vercel

The app needs secrets to run. In your browser:

1. Open https://vercel.com/dashboard → click your `sevengen-pmf` project
2. Go to **Settings → Environment Variables**
3. Add these one by one (copy from your local `.env`, but NEXTAUTH_URL changes):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | *(your Neon connection string)* |
   | `NEXTAUTH_SECRET` | *(run `npx next-auth secret` OR any random 32+ char string)* |
   | `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` *(paste your Vercel URL here)* |
   | `CRON_SECRET` | *(any random string — used by Vercel's cron)* |

4. Go to **Deployments → ...(three dots) on latest → Redeploy** to apply the env vars.

## Part 5 · Production deploy

```bash
npx vercel --prod
```

You'll get a URL like `https://sevengen-pmf.vercel.app` — share this with anyone.

---

## ✅ What's included in production

- **Daily reminders automation**: Vercel Cron hits `/api/cron/reminders` every day at 9am — emails pending evaluations.
- **Database migrations** run automatically on every deploy (via `vercel.json`).
- **HTTPS** everywhere (auto via Vercel).
- **Custom domain** (optional): In Vercel → Settings → Domains → add `pmf.yourcompany.com`.

## 🔐 Switch email from console to real SMTP

Add to Vercel's Environment Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="PMF System <noreply@sevengen.com>"
```

Then redeploy. Emails will actually go out instead of appearing in Vercel logs.

## 🆘 Troubleshooting

- **"prisma migrate deploy failed"** → check `DATABASE_URL` env var is set in Vercel Settings
- **"Cannot sign in"** → `NEXTAUTH_URL` must exactly match your Vercel URL, including `https://`
- **"Internal server error"** → click on the failed deployment in Vercel → view Function Logs
