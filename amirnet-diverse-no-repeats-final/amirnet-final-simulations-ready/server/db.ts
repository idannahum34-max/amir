import { and, desc, eq, gte, inArray, lte, ne, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  answers,
  examAttempts,
  exams,
  passages,
  payments,
  questionReports,
  questions,
  savedQuestions,
  subscriptionPlans,
  subscriptions,
  userVocabularyProgress,
  userWeaknessProfiles,
  users,
  vocabularyWords,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId || (user.email && user.email.trim().toLowerCase() === ENV.ownerEmail)) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  return result[0];
}

export async function getUserById(id: number | string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq((users as any).id, id as any)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result[0];
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getUserSubscription(userId: number | string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const now = new Date();
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq((subscriptions as any).userId, userId as any), gte(subscriptions.expiresAt, now)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result[0];
  } catch (error) {
    console.warn("[subscription] getUserSubscription failed", error);
    return undefined;
  }
}

export async function createSubscription(data: {
  userId: number | string;
  planId: number;
  expiresAt: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  provider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  providerOrderId?: string;
  status?: "active" | "trial" | "past_due" | "cancelled" | "expired";
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(subscriptions).values({
      userId: data.userId as any,
      planId: data.planId,
      expiresAt: data.expiresAt,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
      provider: data.provider ?? (data.providerSubscriptionId ? "lemonsqueezy" : "manual"),
      providerSubscriptionId: data.providerSubscriptionId,
      providerCustomerId: data.providerCustomerId,
      providerOrderId: data.providerOrderId,
      status: data.status ?? "active",
    } as any);
  } catch (error) {
    // Do not block premium unlock if the legacy subscriptions table has an incompatible userId type.
    console.warn("[subscription] createSubscription insert skipped", error);
  }
}

export async function updateUserPremiumStatus(data: {
  userId: number | string;
  premium: boolean;
  subscriptionStatus: string;
  subscriptionProvider?: string;
  subscriptionId?: string;
  currentPeriodEnd?: Date | null;
  planType?: string;
  lemonCustomerId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    premium: data.premium,
    subscriptionStatus: data.subscriptionStatus,
    subscriptionProvider: data.subscriptionProvider,
    subscriptionId: data.subscriptionId,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    planType: data.planType,
    lemonCustomerId: data.lemonCustomerId,
    updatedAt: new Date(),
  } as any).where(eq((users as any).id, data.userId as any));
}

export async function upsertProviderSubscription(data: {
  userId: number | string;
  planId: number;
  provider: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  providerOrderId?: string;
  status: "active" | "trial" | "past_due" | "cancelled" | "expired";
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) return;

  if (data.providerSubscriptionId) {
    const existing = await db.select().from(subscriptions).where(
      and(eq((subscriptions as any).provider, data.provider), eq((subscriptions as any).providerSubscriptionId, data.providerSubscriptionId))
    ).limit(1);
    if (existing[0]) {
      await db.update(subscriptions).set({
        userId: data.userId as any,
        planId: data.planId,
        providerCustomerId: data.providerCustomerId,
        providerOrderId: data.providerOrderId,
        status: data.status,
        expiresAt: data.expiresAt,
        cancelledAt: data.status === "cancelled" ? new Date() : null,
      } as any).where(eq(subscriptions.id, existing[0].id));
      await updateUserPremiumStatus({
        userId: data.userId,
        premium: data.status === "active" || data.status === "trial",
        subscriptionStatus: data.status,
        subscriptionProvider: data.provider,
        subscriptionId: data.providerSubscriptionId,
        currentPeriodEnd: data.expiresAt,
        planType: String(data.planId),
        lemonCustomerId: data.providerCustomerId,
      });
      return;
    }
  }

  await createSubscription(data);
  await updateUserPremiumStatus({
    userId: data.userId,
    premium: data.status === "active" || data.status === "trial",
    subscriptionStatus: data.status,
    subscriptionProvider: data.provider,
    subscriptionId: data.providerSubscriptionId,
    currentPeriodEnd: data.expiresAt,
    planType: String(data.planId),
    lemonCustomerId: data.providerCustomerId,
  });
}

export async function recordPayment(data: {
  userId: number | string;
  subscriptionId?: number;
  amountIls: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  provider?: string;
  providerPaymentId?: string;
  providerOrderId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(payments).values({
      userId: data.userId as any,
      subscriptionId: data.subscriptionId,
      amountIls: data.amountIls,
      status: data.status,
      provider: data.provider ?? "manual",
      providerPaymentId: data.providerPaymentId,
      providerOrderId: data.providerOrderId,
    } as any);
  } catch (error) {
    // Payment history is useful, but it must not block premium unlock.
    console.warn("[billing] recordPayment skipped", error);
  }
}

export async function getUserWithPlan(userId: number | string) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserById(userId);
  if (user?.premium === true || user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trial") {
    const fallbackPlan = await getPlanById(Number(user.planType ?? 3)).catch(() => undefined as any);
    return {
      subscription: {
        id: user.subscriptionId ?? "user-premium",
        userId: user.id,
        planId: Number(user.planType ?? 3),
        status: user.subscriptionStatus ?? "active",
        expiresAt: user.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        provider: user.subscriptionProvider ?? "manual",
      } as any,
      plan: fallbackPlan ?? ({ id: 3, name: "premium", nameHe: "פרימיום", priceIls: "99", durationDays: 30 } as any),
    };
  }

  const sub = await getUserSubscription(userId);
  if (!sub) return { subscription: null, plan: null };
  const plan = await getPlanById(sub.planId);
  return { subscription: sub, plan: plan ?? null };
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getApprovedQuestions(opts?: {
  type?: string;
  minDifficulty?: number;
  maxDifficulty?: number;
  limit?: number;
  excludeIds?: number[];
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(questions.status, "approved"), eq(questions.isPilot, false)];
  if (opts?.type) conditions.push(eq(questions.type, opts.type as any));
  if (opts?.minDifficulty) conditions.push(gte(questions.difficulty, opts.minDifficulty));
  if (opts?.maxDifficulty) conditions.push(lte(questions.difficulty, opts.maxDifficulty));
  if (opts?.excludeIds?.length) conditions.push(notInArray(questions.id, opts.excludeIds));

  const requestedLimit = opts?.limit ?? 20;
  const fetchLimit = Math.min(Math.max(requestedLimit * 6, requestedLimit), 300);
  const rows = await db
    .select()
    .from(questions)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(fetchLimit);

  // Never show duplicated items in the same practice/simulation session.
  const seen = new Set<string>();
  const unique: typeof rows = [];
  for (const row of rows) {
    const key = `${row.type}::${String(row.questionText).trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= requestedLimit) break;
  }
  const enriched = await Promise.all(unique.map(async (row: any) => {
    if (!row.passageId) return row;
    const passage = await getPassageById(row.passageId).catch(() => undefined);
    return { ...row, passage };
  }));
  return enriched as any;
}


export async function getSimulationExams() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(exams)
      .where(eq((exams as any).isSimulation, true as any))
      .orderBy(exams.id)
      .limit(50);
  } catch (error) {
    console.warn("[exams] getSimulationExams failed", error);
    return [];
  }
}

export async function getSimulationQuestions(simulationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  try {
    const tag = `simulation_${simulationId}`;
    const rows: any[] = await db
      .select()
      .from(questions)
      .where(and(
        eq(questions.status, "approved"),
        eq(questions.isPilot, false),
        sql`${questions.tags} @> ${JSON.stringify([tag])}::jsonb` as any,
      ))
      .orderBy(sql`case
        when ${questions.type} = 'sentence_completion' then 1
        when ${questions.type} = 'restatement' then 2
        when ${questions.type} = 'reading_comprehension' then 3
        else 4 end`, questions.id)
      .limit(limit);

    const enriched = await Promise.all(rows.map(async (row: any) => {
      if (!row.passageId) return row;
      const passage = await getPassageById(row.passageId).catch(() => undefined);
      return { ...row, passage };
    }));
    return enriched;
  } catch (error) {
    console.warn("[exams] getSimulationQuestions failed", error);
    return [];
  }
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result[0];
}

export async function getQuestionsForAdmin(opts?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.status) conditions.push(eq(questions.status, opts.status as any));
  return db
    .select()
    .from(questions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function updateQuestionStatus(id: number, status: "approved" | "rejected" | "draft") {
  const db = await getDb();
  if (!db) return;
  await db.update(questions).set({ status }).where(eq(questions.id, id));
}

export async function upsertQuestion(data: any) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(questions).set(data).where(eq(questions.id, data.id));
  } else {
    await db.insert(questions).values(data);
  }
}

export async function getPassageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passages).where(eq(passages.id, id)).limit(1);
  return result[0];
}

// ─── Exam Attempts ────────────────────────────────────────────────────────────

export async function createExamAttempt(data: {
  userId: number | string;
  mode: "practice" | "adaptive" | "simulation" | "vocabulary_quiz";
  questionIds: number[];
  examId?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(examAttempts).values({
    userId: data.userId as any,
    mode: data.mode,
    examId: data.examId,
    questionIds: data.questionIds as any,
    totalQuestions: data.questionIds.length,
    status: "in_progress",
  } as any).returning({ id: examAttempts.id });
  return result[0]?.id ?? null;
}

export async function getAttemptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(examAttempts).where(eq(examAttempts.id, id)).limit(1);
  return result[0];
}

export async function finishAttempt(id: number, data: {
  score: number;
  estimatedAmirnetScore: number;
  correctAnswers: number;
  timeTakenSeconds: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(examAttempts).set({
    status: "completed",
    completedAt: new Date(),
    ...data,
  }).where(eq(examAttempts.id, id));
}

export async function getUserAttempts(userId: number | string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(examAttempts)
    .where(and(eq((examAttempts as any).userId, userId as any), eq(examAttempts.status, "completed")))
    .orderBy(desc(examAttempts.completedAt))
    .limit(limit);
}

// ─── Answers ──────────────────────────────────────────────────────────────────

export async function saveAnswer(data: {
  attemptId: number;
  userId: number | string;
  questionId: number;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  timeTakenSeconds: number;
  usedHint?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(answers).values(data as any);
  } catch (error) {
    console.warn("[answers] saveAnswer skipped", error);
  }
}

export async function getAnswersForAttempt(attemptId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(answers).where(eq(answers.attemptId, attemptId));
  } catch (error) {
    console.warn("[answers] getAnswersForAttempt failed", error);
    return [];
  }
}

export async function getUserAnswerHistory(userId: number | string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(answers)
      .where(eq((answers as any).userId, userId as any))
      .orderBy(desc(answers.answeredAt))
      .limit(limit);
  } catch (error) {
    console.warn("[answers] getUserAnswerHistory failed", error);
    return [];
  }
}

// ─── Weakness Profile ─────────────────────────────────────────────────────────

export async function getOrCreateWeaknessProfile(userId: number | string) {
  const fallback = {
    id: 0,
    userId,
    vocabularyAccuracy: "50",
    sentenceCompletionAccuracy: "50",
    restatementAccuracy: "50",
    readingComprehensionAccuracy: "50",
    avgTimeSec: "0",
    weakTags: [],
    estimatedScore: 100,
    streakDays: 0,
    lastPracticeAt: null,
    totalQuestionsAnswered: 0,
    updatedAt: new Date(),
  } as any;
  const db = await getDb();
  if (!db) return fallback;
  try {
    const existing = await db
      .select()
      .from(userWeaknessProfiles)
      .where(eq((userWeaknessProfiles as any).userId, userId as any))
      .limit(1);
    if (existing[0]) return existing[0];
    await db.insert(userWeaknessProfiles).values({ userId } as any);
    const created = await db
      .select()
      .from(userWeaknessProfiles)
      .where(eq((userWeaknessProfiles as any).userId, userId as any))
      .limit(1);
    return created[0] ?? fallback;
  } catch (error) {
    console.warn("[weakness] profile unavailable; using fallback", error);
    return fallback;
  }
}

export async function updateWeaknessProfile(userId: number | string, data: Partial<{
  vocabularyAccuracy: string;
  sentenceCompletionAccuracy: string;
  restatementAccuracy: string;
  readingComprehensionAccuracy: string;
  avgTimeSec: string;
  estimatedScore: number;
  streakDays: number;
  lastPracticeAt: Date;
  totalQuestionsAnswered: number;
  weakTags: string[];
}>) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(userWeaknessProfiles).set(data as any).where(eq((userWeaknessProfiles as any).userId, userId as any));
  } catch (error) {
    console.warn("[weakness] update skipped", error);
  }
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export async function getVocabularyWords(opts?: { limit?: number; offset?: number; difficulty?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = opts?.difficulty ? [eq(vocabularyWords.difficulty, opts.difficulty)] : [];
  return db
    .select()
    .from(vocabularyWords)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vocabularyWords.frequency))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function upsertVocabularyWord(data: any) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(vocabularyWords).set(data).where(eq(vocabularyWords.id, data.id));
  } else {
    await db.insert(vocabularyWords).values(data);
  }
}

export async function getVocabularyForAdmin(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vocabularyWords).orderBy(desc(vocabularyWords.createdAt)).limit(opts?.limit ?? 100).offset(opts?.offset ?? 0);
}

export async function getVocabProgress(userId: number | string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userVocabularyProgress)
    .where(eq((userVocabularyProgress as any).userId, userId as any));
}

export async function upsertVocabProgress(userId: number | string, wordId: number, masteryLevel: number) {
  const db = await getDb();
  if (!db) return;
  const nextReview = new Date(Date.now() + masteryLevel * 24 * 60 * 60 * 1000);
  const existing = await db
    .select()
    .from(userVocabularyProgress)
    .where(and(eq((userVocabularyProgress as any).userId, userId as any), eq(userVocabularyProgress.wordId, wordId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(userVocabularyProgress)
      .set({ masteryLevel, nextReviewAt: nextReview, reviewCount: (existing[0].reviewCount ?? 0) + 1, lastReviewedAt: new Date() })
      .where(eq(userVocabularyProgress.id, existing[0].id));
  } else {
    await db.insert(userVocabularyProgress).values({ userId: userId as any, wordId, masteryLevel, nextReviewAt: nextReview, reviewCount: 1, lastReviewedAt: new Date() } as any);
  }
}

// ─── Saved Questions ──────────────────────────────────────────────────────────

export async function getSavedQuestions(userId: number | string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedQuestions).where(eq((savedQuestions as any).userId, userId as any));
}

export async function toggleSavedQuestion(userId: number | string, questionId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(savedQuestions)
    .where(and(eq((savedQuestions as any).userId, userId as any), eq(savedQuestions.questionId, questionId)))
    .limit(1);
  if (existing[0]) {
    await db.delete(savedQuestions).where(eq(savedQuestions.id, existing[0].id));
    return false;
  } else {
    await db.insert(savedQuestions).values({ userId: userId as any, questionId } as any);
    return true;
  }
}

// ─── Question Reports ─────────────────────────────────────────────────────────

export async function reportQuestion(userId: number | string, questionId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(questionReports).values({ userId: userId as any, questionId, reason } as any);
  await db.update(questions).set({ reportCount: sql`"reportCount" + 1` }).where(eq(questions.id, questionId));
}

export async function getPendingReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionReports).where(eq(questionReports.status, "pending")).orderBy(desc(questionReports.createdAt));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalQuestions] = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "approved"));
  const [totalAttempts] = await db.select({ count: sql<number>`count(*)` }).from(examAttempts).where(eq(examAttempts.status, "completed"));
  const [activeSubscriptions] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.status, "active"), gte(subscriptions.expiresAt, new Date())));
  const [pendingReports] = await db.select({ count: sql<number>`count(*)` }).from(questionReports).where(eq(questionReports.status, "pending"));
  const [draftQuestions] = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "draft"));
  return {
    totalUsers: Number(totalUsers?.count ?? 0),
    totalQuestions: Number(totalQuestions?.count ?? 0),
    approvedQuestions: Number(totalQuestions?.count ?? 0),
    pendingQuestions: Number(draftQuestions?.count ?? 0),
    totalAttempts: Number(totalAttempts?.count ?? 0),
    activeSubscriptions: Number(activeSubscriptions?.count ?? 0),
    pendingReports: Number(pendingReports?.count ?? 0),
    draftQuestions: Number(draftQuestions?.count ?? 0),
  };
}
