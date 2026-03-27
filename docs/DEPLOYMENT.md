# Crochet Hub — Deployment Guide

Deploy Crochet Hub for free using Neon (PostgreSQL), Render (backend), Vercel (frontend), and Upstash (Redis).

**Estimated time:** 30-45 minutes

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Vercel         │      │   Render          │      │   Neon        │
│   Next.js        │─────>│   Express.js      │─────>│   PostgreSQL  │
│   (Frontend)     │  API │   + Socket.io     │      │   (Database)  │
│   Port 443       │      │   Port 4000       │      └──────────────┘
└─────────────────┘      │                    │
                          │   + BullMQ Jobs    │──────┌──────────────┐
                          └──────────────────┘      │   Upstash     │
                                                     │   Redis       │
                                                     │   (Optional)  │
                                                     └──────────────┘
```

---

## Step 1: Create Neon Database (5 min)

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create a project: `crochet-hub`
3. Copy the **connection string** — looks like:
   ```
   postgresql://username:password@ep-something.region.aws.neon.tech/crochet_hub?sslmode=require
   ```
4. Save this — you'll need it for Render's `DATABASE_URL`

---

## Step 2: Create Upstash Redis (5 min) — Optional

1. Go to [upstash.com](https://upstash.com) → Sign up (free)
2. Create a Redis database in the nearest region
3. Copy the **Redis URL** (starts with `rediss://`)
4. Save this for Render's `REDIS_URL`

> **Note:** The app works without Redis. Background jobs (SLA checks, quote expiry) just won't run. You can add Redis later.

---

## Step 3: Deploy Backend on Render (15 min)

### Option A: Blueprint (Automatic)

1. Push the repo to GitHub (if not already)
2. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
3. Click **New Blueprint Instance** → connect your GitHub repo
4. Render auto-detects `render.yaml` → fill in:
   - `DATABASE_URL` = your Neon connection string
   - `CORS_ORIGIN` = `https://your-app.vercel.app` (set after Step 4, update later)
   - `REDIS_URL` = your Upstash Redis URL (optional)
5. Click **Apply** → Render builds and deploys

### Option B: Manual

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `crochet-hub-api`
   - **Region:** Singapore (or nearest)
   - **Runtime:** Node
   - **Build Command:**
     ```bash
     npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @crochet-hub/shared build && pnpm --filter @crochet-hub/api run db:generate && pnpm --filter @crochet-hub/api build
     ```
   - **Start Command:** `node apps/api/dist/server.js`
   - **Plan:** Free
4. Add environment variables (see table below)
5. Click **Create Web Service**

### After Deploy: Initialize Database

Once the backend is live, open the **Shell** tab in Render and run:
```bash
cd apps/api && npx prisma db push && npx tsx prisma/seed.ts
```

This creates all tables and seeds test accounts.

---

## Step 4: Deploy Frontend on Vercel (10 min)

1. Go to [vercel.com](https://vercel.com) → Sign up (free, connect GitHub)
2. Click **New Project** → import your GitHub repo
3. Vercel auto-detects `vercel.json` — settings should be:
   - **Framework:** Next.js
   - **Root Directory:** `./` (monorepo root)
   - **Build Command:** auto-detected from vercel.json
4. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://crochet-hub-api.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://crochet-hub-api.onrender.com` |
   | `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |

5. Click **Deploy**

### After Deploy: Update CORS

Go back to Render dashboard → your backend service → **Environment** tab:
- Set `CORS_ORIGIN` to your Vercel URL (e.g., `https://crochet-hub.vercel.app`)
- Click **Save** → Render auto-redeploys

---

## Step 5: Verify Deployment (5 min)

### Backend Health Check
```bash
curl https://crochet-hub-api.onrender.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Frontend
- Visit your Vercel URL
- Homepage should load with products
- Login with seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crochethub.com | admin123456 |
| Buyer | buyer@test.com | buyer123456 |
| Seller | seller@test.com | seller123456 |

### Quick Smoke Test
1. Browse products → click a product → verify detail page
2. Login as buyer → add to cart → go to checkout
3. Login as admin → check dashboard → verify KPIs load
4. Login as seller → check dashboard → verify orders/payouts

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Set to `production` |
| `DATABASE_URL` | Yes | — | Neon PostgreSQL connection string |
| `API_PORT` | No | `4000` | Server port (Render sets `PORT` automatically) |
| `CORS_ORIGIN` | Yes | — | Vercel frontend URL (comma-separated for multiple) |
| `JWT_ACCESS_SECRET` | Yes | — | Min 32 chars. Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Yes | — | Min 32 chars. Generate: `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiry |
| `REDIS_URL` | No | — | Upstash Redis URL (optional) |
| `PAYMENT_GATEWAY` | No | `mock` | `mock`, `razorpay`, or `stripe` |
| `SMTP_HOST` | No | — | Email SMTP host |
| `SMTP_PORT` | No | `587` | Email SMTP port |
| `SMTP_USER` | No | — | Email account |
| `SMTP_PASS` | No | — | Email password |
| `LOG_LEVEL` | No | `debug` | `debug`, `info`, `warn`, `error` |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Render backend URL + `/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Render backend URL (no path) |
| `NEXTAUTH_SECRET` | Yes | Min 32 chars |
| `NEXTAUTH_URL` | Yes | Vercel frontend URL |

---

## Free Tier Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Vercel** | Hobby | 100GB bandwidth, 100 deployments/day |
| **Render** | Free | 750 hrs/month, auto-sleep after 15 min inactivity |
| **Neon** | Free | 0.5 GB storage, 1 compute branch |
| **Upstash** | Free | 10K commands/day, 256MB storage |

### Important: Render Free Tier Sleep

Render's free tier puts your backend to sleep after 15 minutes of inactivity. First request after sleep takes ~30-60 seconds (cold start). This is fine for development/demo but not for production.

**To keep it alive:** Use [cron-job.org](https://cron-job.org) to ping `https://your-backend.onrender.com/health` every 10 minutes.

---

## Troubleshooting

### Backend won't start
- Check **Logs** tab in Render dashboard
- Common issues: missing env vars, wrong DATABASE_URL format
- Ensure `?sslmode=require` is in Neon connection string

### Frontend shows "Network Error"
- Check CORS_ORIGIN matches your Vercel URL exactly (include `https://`)
- Check NEXT_PUBLIC_API_URL points to correct Render URL

### Database errors
- Run `npx prisma db push` in Render Shell to sync schema
- Run `npx tsx prisma/seed.ts` to seed test data

### Socket.io not connecting
- NEXT_PUBLIC_SOCKET_URL must be the Render URL without `/api/v1`
- Render free tier may need WebSocket upgrade (available on paid plans)

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `crochethub.com`)
3. Update DNS CNAME to `cname.vercel-dns.com`

### Render
1. Go to Service Settings → Custom Domains
2. Add subdomain (e.g., `api.crochethub.com`)
3. Update DNS CNAME to your Render URL

Then update:
- `CORS_ORIGIN` on Render to include your custom domain
- `NEXT_PUBLIC_API_URL` on Vercel to use `api.crochethub.com`
