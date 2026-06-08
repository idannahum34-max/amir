# Billing and Premium Access Changes

Implemented a production-ready Lemon Squeezy flow for a single Premium plan.

## Added / updated

- One paid plan: Premium, ₪99/month.
- 14-day free trial messaging across the site.
- Real Lemon Squeezy checkout creation.
- Signed `/api/billing/webhook` endpoint.
- Automatic premium unlock from webhook-confirmed `active` or `trial` subscriptions.
- Server-side premium access guard.
- Public `/demo` route that stays available without signup/payment.
- Locked premium UI for practice, simulations and vocabulary when no Premium subscription exists.
- Env templates now use only `LEMONSQUEEZY_VARIANT_PREMIUM`.

## Important production notes

- Configure the actual 14-day trial on the Lemon Squeezy subscription variant. The app displays the trial; Lemon controls the billing behavior.
- Set webhook URL to: `https://YOUR_DOMAIN.com/api/billing/webhook`.
- Use the same signing secret in Lemon Squeezy and `LEMONSQUEEZY_WEBHOOK_SECRET`.
- Do not enable `ALLOW_MOCK_BILLING` in production.

## Validation target

Run before deployment:

```bash
npm install
npm run check
npm run build
```
