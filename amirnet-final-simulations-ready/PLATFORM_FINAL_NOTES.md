# AmirNet final simulation platform update

This package includes the requested professional platform fixes:

- 50 full simulations in the Simulations section.
- Each simulation has 50 questions: 20 sentence completion, 20 restatement, 2 reading passages with 5 questions each.
- Practice mode loads 100 questions.
- Adaptive mode loads 50 questions.
- Reading passages render as a separate passage card plus a separate question prompt.
- Vocabulary seed contains 200 real academic/AMIRNET-useful English words, not placeholder `academic_word_*` values.
- Hints use a deterministic fallback if OpenAI is unavailable, so the button does not silently fail.
- Supabase schema includes all premium tables needed for saving answers, attempts, weakness profiles, vocabulary progress, saved questions and reports.

Run `SUPABASE_RUN_THIS_FIRST.sql` in Supabase SQL Editor after deploying the code.
