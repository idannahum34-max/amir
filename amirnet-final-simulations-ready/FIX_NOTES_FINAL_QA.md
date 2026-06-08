# AmirNet final QA repair

This build addresses the premium-platform issues reported after payment/trial unlock:

- Removed duplicated-question behavior inside a session by filtering repeated question text server-side.
- Added deterministic AI-hint fallback so hints work even when OpenAI is unavailable or rate-limited.
- Fixed adaptive practice crash by making weakness-profile reads/writes resilient and by adding the required schema.
- Updated the full simulation timer to 50 minutes, matching the official AMIRNET FAQ that the exam is about 50 minutes.
- Cleaned the top navigation labels.
- Added `SUPABASE_FULL_PLATFORM_SCHEMA_AND_SEED.sql` with the full database schema, 900+ questions, 30 simulations, and 1000 vocabulary items.

Important: after deploying this build, run `SUPABASE_FULL_PLATFORM_SCHEMA_AND_SEED.sql` once in Supabase SQL Editor.
