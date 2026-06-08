# Deploy Ready Notes

This package is independent from External auth/runtime and uses local email/password authentication.

## Required env vars

- `DATABASE_URL`
- `COOKIE_SECRET`
- `OWNER_EMAIL`
- `OPENAI_API_KEY`

## Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm build:vercel
pnpm db:push
pnpm db:seed
```

## Free demo funnel

- `/demo` is public and limited.
- Free plan exists in seed data.
- Premium upgrade prompts route to `/pricing`.

## Before paid traffic

Do a real deploy test on the final domain and review seed content manually. The app is structured for launch, but exam-prep trust depends on content QA.
