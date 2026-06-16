# AMIRNET Prep Platform

A GitHub-ready, Vercel-ready AMIRNET preparation web app with local email/password auth, practice questions, simulations, vocabulary training, admin tools, and a free-demo-to-premium funnel.

## What is included

- Independent local auth: signup, login, logout, current user
- Secure session cookies
- Admin role via `OWNER_EMAIL`
- Vercel serverless entrypoint under `api/index.ts`
- 500+ original AMIRNET-style questions via seed
- 10 full simulation records via seed
- 1,000+ vocabulary items via seed
- Free public demo at `/demo`
- Pricing page and premium upgrade CTAs
- Dashboard, practice, exam, vocabulary, profile, admin pages

## Local setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

## Production setup

Required environment variables:

```bash
DATABASE_URL
COOKIE_SECRET
OWNER_EMAIL
OPENAI_API_KEY
```

Then:

```bash
npm run db:push
npm run db:seed
npm run build:vercel
```

## Vercel Deployment

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Configure the environment variables listed above in Vercel project settings.
4. The project is pre-configured for Vercel with `vercel.json` and uses `npm`.
5. Ensure "Build Command" is `npm run build:vercel` and "Output Directory" is `dist/public`.

## Demo funnel

Public users can open `/demo` without signing in and answer a limited set of questions. Upgrade CTAs direct users to `/pricing` and `/login`.

## Content

See `CONTENT_INVENTORY.md` for launch seed counts and QA notes.
