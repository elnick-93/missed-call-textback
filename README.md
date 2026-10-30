# Missed Call Text-Back

> ⚠️ **UNTESTED SCAFFOLD.** This code was written without being installed, typechecked, or built. Expect to fix compile errors and verify every integration (Stripe, Twilio, Supabase, Resend) in test mode before taking real customers.

$49/mo missed-call text-back for local trades. When a call to the business goes unanswered, the caller gets an instant SMS and the owner gets an SMS + email alert. Replies are forwarded to the owner.

Stack: Next.js 15 (App Router, TypeScript) on Cloudflare Workers via `@opennextjs/cloudflare`, Supabase Auth (magic link + Google), Postgres via Drizzle + postgres-js, Stripe Checkout + Customer Portal, Twilio (REST via fetch), Resend, PostHog.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

For `wrangler`/preview, also put the same values in `.dev.vars`. Twilio webhooks need a public URL (e.g. `cloudflared tunnel` or ngrok); set `APP_URL` to that URL exactly, since Twilio signature validation uses it.

## Supabase

1. Create a project. Copy URL, anon key, service role key, and the **pooler** connection string (transaction mode, port 6543) into `DATABASE_URL`.
2. Auth → Providers: enable Email (magic link) and Google (add Google OAuth client ID/secret).
3. Auth → URL Configuration: set Site URL to `APP_URL` and add `APP_URL/auth/callback` to redirect URLs.
4. Run the migration: `npm run db:migrate` (or paste `drizzle/0000_init.sql` into the SQL editor). Tables are accessed server-side only; enable RLS with no policies if you want to block the anon key from them.

## Stripe

1. Create a product "Missed Call Text-Back" with a recurring $49/month price → `STRIPE_PRICE_ID`.
2. Webhook endpoint: `APP_URL/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`.
3. Settings → Billing → Customer portal: activate it (allow cancel, update payment method).

## Twilio

1. Buy a local number per customer and set `accounts.twilio_number` (E.164, e.g. `+15125550100`) for that account. (Number provisioning is manual in this MVP.)
2. Number → Voice → "A call comes in": Webhook `POST APP_URL/api/voice`.
3. Create a Messaging Service, add the numbers to its sender pool → `TWILIO_MESSAGING_SERVICE_SID`. Set its incoming message webhook to `POST APP_URL/api/sms/inbound` (or set it on each number).

## Customer setup: conditional call forwarding

The customer keeps their own number and forwards **unanswered/busy** calls to their Twilio number. On most US carriers: dial `*71` + Twilio number (Verizon) or `**61*<number>#` / `**67*<number>#` (AT&T/T-Mobile GSM). Carrier codes vary; test it. Flow: caller → owner's cell rings → unanswered → forwarded to Twilio → we ring `owner_cell` again for 20s → if still no answer, text-back fires.

> Note: because we re-dial the owner's cell, a forwarded call can loop if forwarding triggers again. If that happens, change `/api/voice` to skip `<Dial>` and send the text-back immediately.

## Deploy to Cloudflare

```bash
npx opennextjs-cloudflare build && npx wrangler deploy
# secrets (repeat for each):
npx wrangler secret put DATABASE_URL
npx wrangler secret put STRIPE_SECRET_KEY
# ... SUPABASE_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, TWILIO_ACCOUNT_SID,
#     TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID, RESEND_API_KEY, RESEND_FROM
```

`NEXT_PUBLIC_*` vars are inlined at **build time**, so they must be present in the environment when you run the build. Set `APP_URL` in `wrangler.jsonc` vars.

### Why not Vercel Hobby?
Vercel's Hobby plan is for non-commercial, personal use only. This is a paid SaaS, so it would need Vercel Pro; Cloudflare Workers' free/paid tiers permit commercial use and are cheap at this scale.

## 10DLC / SMS compliance (US)

- Sending SMS from US 10-digit long codes requires **A2P 10DLC registration**: a Brand plus a Campaign in the Twilio console, linked to your Messaging Service. Unregistered traffic is blocked or filtered.
- Brand/campaign review can take **days** (sometimes weeks). Start early.
- Twilio **trial accounts can only text verified numbers**. Upgrade before real use.
- Practical order: register after the first customer pays (or register your own brand early with a "customer care / missed call follow-up" campaign use case).
- Only text people who just called the business. **Never cold-text prospects.** Honor STOP (handled by the Messaging Service and mirrored in `opt_outs`).
