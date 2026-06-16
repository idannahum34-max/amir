# Supabase/Postgres build

This version converts the app from MySQL to Supabase PostgreSQL.

Required Vercel env vars:
- `DATABASE_URL` = Supabase Postgres connection string, not `VITE_SUPABASE_URL`
- `COOKIE_SECRET`
- `OWNER_EMAIL`
- `OPENAI_API_KEY`
- `LEMONSQUEEZY_STORE_ID=388698`
- `LEMONSQUEEZY_VARIANT_ID=1710097`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`

After setting `DATABASE_URL`, run locally from the project root:

```powershell
npm install
npm run db:push
npm run db:seed
```

Then redeploy on Vercel.
