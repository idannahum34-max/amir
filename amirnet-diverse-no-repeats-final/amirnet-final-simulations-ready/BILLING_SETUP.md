# Lemon Squeezy Billing Setup

This build is wired for one paid plan only: **פרימיום — ₪99/month with 14 days free trial**.

## Required environment variables

```env
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_VARIANT_PREMIUM=...
```

Keep the existing production env vars too:

```env
DATABASE_URL=...
COOKIE_SECRET=...
OWNER_EMAIL=...
OPENAI_API_KEY=...
```

## Lemon Squeezy dashboard setup

1. Create one subscription product/variant in Lemon Squeezy: `Premium`, ₪99/month.
2. Configure the variant trial to **14 days** inside Lemon Squeezy. Do not rely on the website text alone.
3. Copy the Store ID and Premium Variant ID into Vercel env vars.
4. Create a webhook in Lemon Squeezy:
   - URL: `https://YOUR_DOMAIN.com/api/billing/webhook`
   - Signing secret: same value as `LEMONSQUEEZY_WEBHOOK_SECRET`
   - Recommended events:
     - `order_created`
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_expired`
     - `subscription_payment_success`
     - `subscription_payment_failed`

## How activation works

- User registers/logs in.
- User clicks the Premium CTA.
- The server creates a hosted Lemon Squeezy checkout with `custom.userId`, `custom.planId`, and `custom.planName`.
- Lemon Squeezy sends a signed webhook to `/api/billing/webhook`.
- The server verifies the signature and writes/updates a Premium subscription.
- Premium content unlocks automatically for subscriptions in `active` or `trial` status.

## Access rules in this build

- `/demo` is public and stays open even without signup or payment.
- Premium content is server-locked: questions, vocabulary, simulations, AI hints, progress and attempt history require Premium access.
- The old mock checkout is blocked in production.

## Production checklist

```bash
npm run db:push
npm run db:seed
npm run check
npm run build
```

Never set `ALLOW_MOCK_BILLING=true` in production.
