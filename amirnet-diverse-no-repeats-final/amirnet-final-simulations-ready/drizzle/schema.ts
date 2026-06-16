import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "trial", "past_due"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "approved", "rejected"]);
export const questionTypeEnum = pgEnum("question_type", ["vocabulary", "sentence_completion", "restatement", "reading_comprehension"]);
export const answerEnum = pgEnum("answer_choice", ["A", "B", "C", "D"]);
export const attemptModeEnum = pgEnum("attempt_mode", ["practice", "adaptive", "simulation", "vocabulary_quiz"]);
export const attemptStatusEnum = pgEnum("attempt_status", ["in_progress", "completed", "abandoned"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "resolved", "dismissed"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: text("passwordHash"),
  role: userRoleEnum("role").default("user").notNull(),
  premium: boolean("premium").default(false).notNull(),
  subscriptionStatus: varchar("subscriptionStatus", { length: 64 }).default("free"),
  subscriptionProvider: varchar("subscriptionProvider", { length: 64 }),
  subscriptionId: varchar("subscriptionId", { length: 256 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  planType: varchar("planType", { length: 64 }),
  lemonCustomerId: varchar("lemonCustomerId", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscription Plans ───────────────────────────────────────────────────────

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  nameHe: varchar("nameHe", { length: 128 }).notNull(),
  priceIls: decimal("priceIls", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("durationDays").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  lemonSqueezyVariantId: varchar("lemonSqueezyVariantId", { length: 128 }),
  maxExamsPerMonth: integer("maxExamsPerMonth").default(3),
  maxQuestionsPerDay: integer("maxQuestionsPerDay").default(20),
  hasAdaptiveLearning: boolean("hasAdaptiveLearning").default(false),
  hasVocabularyModule: boolean("hasVocabularyModule").default(false),
  hasDetailedAnalytics: boolean("hasDetailedAnalytics").default(false),
  hasAiHints: boolean("hasAiHints").default(false),
  isMilitary: boolean("isMilitary").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  planId: integer("planId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 256 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 256 }),
  provider: varchar("provider", { length: 64 }).default("manual"),
  providerSubscriptionId: varchar("providerSubscriptionId", { length: 256 }),
  providerCustomerId: varchar("providerCustomerId", { length: 256 }),
  providerOrderId: varchar("providerOrderId", { length: 256 }),
  status: subscriptionStatusEnum("status").default("trial").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  subscriptionId: integer("subscriptionId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  provider: varchar("provider", { length: 64 }).default("manual"),
  providerPaymentId: varchar("providerPaymentId", { length: 256 }),
  providerOrderId: varchar("providerOrderId", { length: 256 }),
  amountIls: decimal("amountIls", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;

// ─── Reading Passages ─────────────────────────────────────────────────────────

export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  title: text("title"),
  body: text("body").notNull(),
  wordCount: integer("wordCount"),
  difficulty: integer("difficulty").default(5),
  topic: varchar("topic", { length: 128 }),
  status: contentStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Passage = typeof passages.$inferSelect;

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  type: questionTypeEnum("type").notNull(),
  difficulty: integer("difficulty").default(5).notNull(),
  questionText: text("questionText").notNull(),
  choiceA: text("choiceA").notNull(),
  choiceB: text("choiceB").notNull(),
  choiceC: text("choiceC").notNull(),
  choiceD: text("choiceD").notNull(),
  correctAnswer: answerEnum("correctAnswer").notNull(),
  explanationHe: text("explanationHe"),
  whyWrongAHe: text("whyWrongAHe"),
  whyWrongBHe: text("whyWrongBHe"),
  whyWrongCHe: text("whyWrongCHe"),
  whyWrongDHe: text("whyWrongDHe"),
  tags: jsonb("tags").$type<string[]>().default([]),
  estimatedTimeSec: integer("estimatedTimeSec").default(45),
  cefrLevel: varchar("cefrLevel", { length: 8 }),
  passageId: integer("passageId"),
  status: contentStatusEnum("status").default("draft").notNull(),
  isPilot: boolean("isPilot").default(false),
  reportCount: integer("reportCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// ─── Exams ────────────────────────────────────────────────────────────────────

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameHe: varchar("nameHe", { length: 256 }),
  totalQuestions: integer("totalQuestions").default(60),
  timeLimitMinutes: integer("timeLimitMinutes").default(55),
  isAdaptive: boolean("isAdaptive").default(false),
  isSimulation: boolean("isSimulation").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;

// ─── Exam Attempts ────────────────────────────────────────────────────────────

export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  examId: integer("examId"),
  mode: attemptModeEnum("mode").default("practice").notNull(),
  status: attemptStatusEnum("status").default("in_progress").notNull(),
  score: integer("score"),
  estimatedAmirnetScore: integer("estimatedAmirnetScore"),
  totalQuestions: integer("totalQuestions").default(0),
  correctAnswers: integer("correctAnswers").default(0),
  timeTakenSeconds: integer("timeTakenSeconds"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  questionIds: jsonb("questionIds").$type<number[]>().default([]),
});

export type ExamAttempt = typeof examAttempts.$inferSelect;

// ─── Answers ──────────────────────────────────────────────────────────────────

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attemptId").notNull(),
  userId: text("userId").notNull(),
  questionId: integer("questionId").notNull(),
  selectedAnswer: answerEnum("selectedAnswer"),
  isCorrect: boolean("isCorrect"),
  timeTakenSeconds: integer("timeTakenSeconds"),
  usedHint: boolean("usedHint").default(false),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;

// ─── User Weakness Profile ────────────────────────────────────────────────────

export const userWeaknessProfiles = pgTable("user_weakness_profiles", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  vocabularyAccuracy: decimal("vocabularyAccuracy", { precision: 5, scale: 2 }).default("0"),
  sentenceCompletionAccuracy: decimal("sentenceCompletionAccuracy", { precision: 5, scale: 2 }).default("0"),
  restatementAccuracy: decimal("restatementAccuracy", { precision: 5, scale: 2 }).default("0"),
  readingComprehensionAccuracy: decimal("readingComprehensionAccuracy", { precision: 5, scale: 2 }).default("0"),
  avgTimeSec: decimal("avgTimeSec", { precision: 6, scale: 2 }).default("0"),
  weakTags: jsonb("weakTags").$type<string[]>().default([]),
  estimatedScore: integer("estimatedScore").default(100),
  streakDays: integer("streakDays").default(0),
  lastPracticeAt: timestamp("lastPracticeAt"),
  totalQuestionsAnswered: integer("totalQuestionsAnswered").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserWeaknessProfile = typeof userWeaknessProfiles.$inferSelect;

// ─── Vocabulary Words ─────────────────────────────────────────────────────────

export const vocabularyWords = pgTable("vocabulary_words", {
  id: serial("id").primaryKey(),
  word: varchar("word", { length: 128 }).notNull(),
  definition: text("definition").notNull(),
  definitionHe: text("definitionHe").notNull(),
  exampleSentence: text("exampleSentence"),
  difficulty: integer("difficulty").default(5),
  cefrLevel: varchar("cefrLevel", { length: 8 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  audioUrl: varchar("audioUrl", { length: 512 }),
  frequency: integer("frequency").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VocabularyWord = typeof vocabularyWords.$inferSelect;

// ─── User Vocabulary Progress ─────────────────────────────────────────────────

export const userVocabularyProgress = pgTable("user_vocabulary_progress", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  wordId: integer("wordId").notNull(),
  masteryLevel: integer("masteryLevel").default(0),
  nextReviewAt: timestamp("nextReviewAt"),
  reviewCount: integer("reviewCount").default(0),
  lastReviewedAt: timestamp("lastReviewedAt"),
});

export type UserVocabularyProgress = typeof userVocabularyProgress.$inferSelect;

// ─── Saved Questions ──────────────────────────────────────────────────────────

export const savedQuestions = pgTable("saved_questions", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  questionId: integer("questionId").notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

// ─── Question Reports ─────────────────────────────────────────────────────────

export const questionReports = pgTable("question_reports", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  questionId: integer("questionId").notNull(),
  reason: varchar("reason", { length: 512 }),
  status: reportStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestionReport = typeof questionReports.$inferSelect;

// ─── Analytics Events ─────────────────────────────────────────────────────────

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: text("userId"),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
