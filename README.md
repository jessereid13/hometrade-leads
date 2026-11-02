# Hometrade Leads

A pay-per-lead marketplace for home service businesses. Homeowners submit a job (web form or API), the platform prices it, matching pros get an email, and pros buy leads from a balance they load with Stripe. You operate it from an admin console.

**Stack:** Next.js 15 (App Router, server actions) · TypeScript · Prisma 7 + Postgres · Stripe Checkout · Tailwind. One Node process, one database, no queues.

## What's in the box

| Area | Routes | What it does |
|---|---|---|
| Public | `/`, `/quote` | Landing page with live pricing table; homeowner quote form (captures `utm_source` / `utm_campaign`) |
| Intake API | `POST /api/leads` | JSON intake for Zapier, call tracking, external landing pages. Header `x-api-key` |
| Pro auth | `/signup`, `/login`, `/logout` | Email + password, 30-day signed cookie session |
| Pro | `/pro/onboarding` | Company, trades, service ZIPs |
| Pro | `/pro` | Lead feed filtered to their trades + ZIPs; exclusive/shared, urgency filters |
| Pro | `/pro/leads/[id]` | Lead detail, contact blurred until bought, confirm-and-buy |
| Pro | `/pro/my-leads` | Unlocked contacts, pipeline status, refund requests, close-rate tiles |
| Pro | `/pro/billing` | Stripe Checkout top-ups with bonus tiers; transaction ledger |
| Admin | `/admin` | 30-day revenue, sell-through, refund rate, revenue by trade |
| Admin | `/admin/leads` | All leads; reject spam, close withdrawn |
| Admin | `/admin/refunds` | Approve (credits balance) or deny |
| Admin | `/admin/buyers` | Every pro, spend, close rate, manual balance credits |
| Admin | `/admin/pricing` | Base price per trade, shared slot count, emergency and big-job multipliers |

### How a lead is priced
`base (exclusive or shared) × emergencyMult if urgency = NOW × bigJobMult if est. value ≥ threshold`, rounded to the dollar. Defaults live in `src/lib/pricing.ts` and are editable in the admin console. By default, emergencies and big jobs are sold exclusive; everything else is shared with up to 3 pros.

### Why the buy can't oversell
`buyLead()` in `src/lib/leads.ts` runs a serializable transaction with conditional `updateMany` calls on both the lead's slot count and the company's balance. Two pros racing for the last exclusive lead get exactly one winner; the other sees a clear "sold out" message. Every balance change writes a `Transaction` row, so the ledger always reconciles.

## Run it locally

```bash
cp .env.example .env        # fill in DATABASE_URL, AUTH_SECRET, Stripe keys
npm install                 # also generates the Prisma client
npm run db:migrate          # applies prisma/migrations
npm run db:seed             # pricing rules, admin user, 7 sample leads
npm run dev
```

Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. To see the pro side, sign up a second account at `/signup`, then credit it from `/admin/buyers` (or run a Stripe test checkout).

Set `SEED_SAMPLE_LEADS=false` before seeding production.

## Deploy

**Vercel + Neon/Supabase (quickest):**
1. Create a Postgres database; copy its connection string into `DATABASE_URL`.
2. Import the repo in Vercel. Add every variable from `.env.example`. Set `APP_URL` to your domain.
3. Build command: `npm run build`. The first deploy will fail until the schema exists, so run `npm run db:migrate && npm run db:seed` once from your machine with the production `DATABASE_URL`.
4. In Stripe: add a webhook endpoint `https://yourdomain.com/api/stripe/webhook` for the event `checkout.session.completed`, and paste its signing secret into `STRIPE_WEBHOOK_SECRET`.

**Docker / any VPS:** `docker build -t hometrade . && docker run -p 3000:3000 --env-file .env hometrade`. Run migrations the same way.

## Email alerts
With `RESEND_API_KEY` set, every new lead emails each pro whose trades include that trade and whose service ZIPs include that ZIP. Without it, alerts print to the server log. Swap `sendEmail()` in `src/lib/notify.ts` for SendGrid/Postmark/Twilio SMS if you prefer.

## Intake API example

```bash
curl -X POST https://yourdomain.com/api/leads \
  -H "content-type: application/json" -H "x-api-key: $LEAD_API_KEY" \
  -d '{"trade":"PLUMBING","urgency":"NOW","title":"Water heater leaking",
       "description":"50 gal, water on floor","homeownerName":"Dana W",
       "phone":"7205550142","zip":"80202","source":"callrail"}'
```
Optional fields: `estValueCents`, `exclusive`, `email`, `address`, `utmSource`, `utmCampaign`.

## Before you sell it

Things this version deliberately leaves for you to decide, roughly in priority order:

1. **Phone verification.** `Lead.phoneVerified` exists but nothing sets it. Add Twilio Verify (SMS code) to the quote form, or a Lookup call in `createLead()` to drop disconnected numbers. This is the single biggest driver of refund rate.
2. **Service area by radius.** Pros enter ZIP lists. For a radius you'll need a ZIP→lat/lng table (free from the Census ZCTA gazetteer) and a distance filter in the feed query and in `notifyNewLead()`.
3. **Password reset.** Not included. Simplest: a signed, expiring token emailed via `sendEmail()`.
4. **Rate limiting on `/quote` and `/api/leads`.** Put the app behind Vercel's WAF or add a quick per-IP limiter so bot submissions don't turn into refunds.
5. **Terms of service and TCPA consent.** The quote form has a one-line consent sentence; have a lawyer check it for your state before running paid ads.
6. **Payouts to you.** Stripe Checkout settles to your Stripe account directly, so there's no extra payout step.

## Project layout

```
prisma/schema.prisma      data model
prisma/migrations/        SQL migrations (prisma migrate deploy)
prisma/seed.ts            rules, admin, sample leads
src/lib/leads.ts          createLead, buyLead (transactional), approveRefund
src/lib/pricing.ts        pricing rules and priceLead()
src/lib/notify.ts         pro email alerts
src/lib/auth.ts           sessions, password hashing, requireUser/Company/Admin
src/lib/stripe.ts         Stripe client, top-up tiers
src/middleware.ts         protects /pro and /admin
src/app/...               pages and server actions
```
