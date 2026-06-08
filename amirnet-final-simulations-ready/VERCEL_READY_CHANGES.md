# VERCEL_READY_CHANGES.md

This project is configured for independent local authentication, launch content seeding, and Vercel deployment. See README.md, DEPLOY_READY_NOTES.md, VERCEL_DEPLOYMENT.md, and CONTENT_INVENTORY.md.

## Demo crash fix

- `/demo` is now served by the static React app instead of being routed through the Serverless Function.
- The demo no longer depends on the database/API. It contains 10 bundled sample questions, so it works even if the paid backend or Lemon Squeezy setup is not finished yet.
- `vercel.json` now sends only `/api/*` and `/storage/*` to the serverless function; all normal app routes fall back to `/index.html`.
