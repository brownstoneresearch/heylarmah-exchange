# Hey Larmah Exchange — Production Deployment (Pages frontend + Workers API)

This build is now split for production:

- **Frontend website:** `https://heylarmah-exchange.pages.dev`
- **API worker:** `https://heylarmah-exchange.brownstonetberesearch.workers.dev`

## What changed

- Frontend now calls the Worker API over HTTPS using `public/config.js`.
- Backend Worker now runs from `src/worker.js` instead of `public/_worker.js`.
- CORS is locked to the Pages site and the Worker URL.
- Dashboard/admin screens now auto-refresh with live polling for market, balances, KYC, withdrawals, and admin queues.
- Paystack processing is now safer for production: raw-body signature verification is fixed, callback/query names are aligned, and Paystack settlement is finalized idempotently through SQL.

## 1) Supabase setup

1. Create or open your Supabase project.
2. In **SQL Editor**, run `supabase-setup.sql`.
3. If you already deployed an older version, re-run the updated SQL so the new indexes and `finalize_paystack_deposit()` function are created.

Required values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

## 2) Deploy the Worker API

```bash
npm install
npx wrangler login
npm run deploy:worker
```

Worker config lives in `wrangler.toml` and uses:

- `name = "heylarmah-exchange"`
- `main = "src/worker.js"`
- `workers_dev = true`

That name maps to the Worker hostname format `<WORKER_NAME>.<ACCOUNT_SUBDOMAIN>.workers.dev`, which is why your API target is `heylarmah-exchange.brownstonetberesearch.workers.dev`.

### Worker variables / secrets

Set these in **Workers & Pages → your Worker → Settings → Variables and Secrets**.

Plain variables:

- `PUBLIC_URL=https://heylarmah-exchange.pages.dev`
- `WORKER_URL=https://heylarmah-exchange.brownstonetberesearch.workers.dev`
- `ALLOWED_ORIGINS=https://heylarmah-exchange.pages.dev,https://heylarmah-exchange.brownstonetberesearch.workers.dev`
- `SUPABASE_URL=...`
- `SWAP_FEE_BPS=50`
- `TRADE_FEE_BPS=20`
- `RESEND_FROM=Hey Larmah Exchange <onboarding@resend.dev>`

Secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `RESEND_API_KEY` (optional)

## 3) Deploy the Pages frontend

```bash
npm run deploy:pages
```

The frontend assets are in `public/`. This deploy is static only — the API is no longer shipped from Pages.

## 4) Paystack production values

Use these URLs in Paystack:

- **Callback URL:** `https://heylarmah-exchange.pages.dev/paystack_callback.html`
- **Webhook URL:** `https://heylarmah-exchange.brownstonetberesearch.workers.dev/api/paystack/webhook`

## 5) Admin bootstrap

Register normally, then promote your account in Supabase:

```sql
update users set role='admin' where email='YOUR_EMAIL';
```

## 6) Frontend runtime config

The frontend runtime is hard-wired in `public/config.js`:

- `APP_URL = https://heylarmah-exchange.pages.dev`
- `API_BASE_URL = https://heylarmah-exchange.brownstonetberesearch.workers.dev`

If either hostname changes later, update `public/config.js` and redeploy Pages.
