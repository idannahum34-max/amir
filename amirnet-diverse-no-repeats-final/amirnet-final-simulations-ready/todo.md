# AMIRNET Prep Platform — TODO

## Phase 1: Database & Backend
- [x] Extend Drizzle schema: questions, passages, exams, attempts, answers
- [x] Extend Drizzle schema: subscriptions, vocabulary words, user progress
- [x] Extend Drizzle schema: admin moderation queue, analytics events
- [x] Run migrations and verify DB
- [x] Server routers: questions CRUD + filtering
- [x] Server routers: exam session (start, answer, finish)
- [x] Server routers: adaptive engine (weak area detection, next question)
- [x] Server routers: subscription plans + Stripe checkout
- [x] Server routers: vocabulary module (words, progress, spaced repetition)
- [x] Server routers: admin (moderation, user management, analytics)
- [x] Server routers: AI hint generator (LLM-powered Hebrew explanations)
- [x] Owner notification alerts (new sub, payment failure, moderation queue)

## Phase 2: Landing Page
- [x] Hebrew RTL landing page with hero section
- [x] Pricing section (Free, Basic 149₪, Premium 249₪, Military discount)
- [x] Testimonials section
- [x] Features/CTA section
- [x] Minimalist Scandinavian design with pastel blue/blush pink accents

## Phase 3: Auth & Subscription
- [x] Login/register flow with Hebrew copy
- [x] Subscription plan selection page
- [x] Stripe checkout integration (ILS) — placeholder, requires STRIPE_SECRET_KEY
- [x] 14-day money-back guarantee messaging
- [x] Plan access control (free tier limits, premium unlocks)

## Phase 4: Question Bank & Exam Engine
- [x] Question bank browser (filter by type, difficulty, topic)
- [x] Sentence completion questions
- [x] Restatement questions
- [x] Reading comprehension questions + passages
- [x] Full timed exam simulation (6 sections, adaptive difficulty)
- [x] Exam timer
- [x] Score calculation + estimated AMIRNET score
- [x] Post-exam review mode

## Phase 5: Adaptive Learning & Dashboard
- [x] User dashboard (streak, score trend, weak areas)
- [x] Adaptive practice mode (prioritizes weak areas)
- [x] Error analysis dashboard (mistake patterns, score trends)
- [x] Predicted exam score widget
- [x] Progress charts (recharts)

## Phase 6: Vocabulary Module
- [x] Vocabulary word list (3000+ words, difficulty tagged)
- [x] Spaced repetition scheduling
- [x] Audio pronunciation (Web Speech API)
- [x] Word progress tracking
- [x] Flashcard UI with mastery levels

## Phase 7: Admin Panel
- [x] Admin dashboard overview
- [x] Question moderation queue (add, edit, approve, reject)
- [x] User management table
- [x] Reports dashboard

## Phase 8: AI Hints & Alerts
- [x] AI hint generator (LLM, surfaced as "רמז חכם" — not labeled as AI)
- [x] Owner alerts: new subscription
- [x] Owner alerts: payment failure
- [x] Owner alerts: moderation queue items
- [x] Owner alerts: flagged questions

## Phase 9: Polish & Tests
- [x] RTL consistency across all pages
- [x] Mobile-first responsive design
- [x] Vitest unit tests (25 tests passing)
- [x] TypeScript zero errors

## Remaining (requires external setup)
- [ ] Stripe live integration (user must provide own Stripe keys via Settings → Payment — region not eligible for Stripe Claimable Sandbox)
- [ ] Military discount verification flow (UI placeholder present)
