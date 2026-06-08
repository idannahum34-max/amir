import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getSubscriptionPlans: vi.fn().mockResolvedValue([
    { id: 1, slug: "free", nameHe: "מבחן ניסיון חינמי", priceIls: "0", durationDays: 24, maxQuestionsPerDay: 10, isActive: true },
    { id: 3, slug: "premium", nameHe: "פרימיום", priceIls: "99", durationDays: 30, maxQuestionsPerDay: -1, isActive: true },
  ]),
  getPlanById: vi.fn().mockResolvedValue({ id: 3, slug: "premium", nameHe: "פרימיום", priceIls: "99", durationDays: 30 }),
  getUserSubscription: vi.fn().mockResolvedValue(null),
  getUserWithPlan: vi.fn().mockResolvedValue({
    subscription: { id: 99, userId: 1, planId: 3, status: "active", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    plan: { id: 3, name: "premium", nameHe: "פרימיום", priceIls: "99", durationDays: 30 },
  }),
  createSubscription: vi.fn().mockResolvedValue(undefined),
  getApprovedQuestions: vi.fn().mockResolvedValue([
    {
      id: 1, type: "vocabulary", difficulty: 5, questionText: "Choose the word closest in meaning to 'benevolent'",
      choiceA: "kind", choiceB: "cruel", choiceC: "fast", choiceD: "slow",
      correctAnswer: "A", explanationHe: "Benevolent פירושו טוב לב", status: "approved", isPilot: false,
    },
  ]),
  getQuestionById: vi.fn().mockResolvedValue({
    id: 1, type: "vocabulary", difficulty: 5, questionText: "Choose the word closest in meaning to 'benevolent'",
    choiceA: "kind", choiceB: "cruel", choiceC: "fast", choiceD: "slow",
    correctAnswer: "A", explanationHe: "Benevolent פירושו טוב לב", status: "approved", isPilot: false,
  }),
  getQuestionsForAdmin: vi.fn().mockResolvedValue([]),
  updateQuestionStatus: vi.fn().mockResolvedValue(undefined),
  upsertQuestion: vi.fn().mockResolvedValue(undefined),
  getPassageById: vi.fn().mockResolvedValue(null),
  createExamAttempt: vi.fn().mockResolvedValue(42),
  getAttemptById: vi.fn().mockResolvedValue({
    id: 42, userId: 1, mode: "practice", status: "in_progress",
    questionIds: [1], totalQuestions: 1,
  }),
  finishAttempt: vi.fn().mockResolvedValue(undefined),
  getUserAttempts: vi.fn().mockResolvedValue([]),
  saveAnswer: vi.fn().mockResolvedValue(undefined),
  getAnswersForAttempt: vi.fn().mockResolvedValue([]),
  getUserAnswerHistory: vi.fn().mockResolvedValue([]),
  getOrCreateWeaknessProfile: vi.fn().mockResolvedValue({
    userId: 1, vocabularyAccuracy: "70", sentenceCompletionAccuracy: "60",
    restatementAccuracy: "55", readingComprehensionAccuracy: "65",
    estimatedScore: 110, totalQuestionsAnswered: 50, streakDays: 3,
  }),
  updateWeaknessProfile: vi.fn().mockResolvedValue(undefined),
  getVocabularyWords: vi.fn().mockResolvedValue([
    { id: 1, word: "benevolent", translationHe: "טוב לב", difficulty: 3, frequency: 100 },
    { id: 2, word: "ephemeral", translationHe: "חולף", difficulty: 5, frequency: 80 },
  ]),
  getVocabProgress: vi.fn().mockResolvedValue([]),
  upsertVocabProgress: vi.fn().mockResolvedValue(undefined),
  getSavedQuestions: vi.fn().mockResolvedValue([]),
  toggleSavedQuestion: vi.fn().mockResolvedValue(true),
  reportQuestion: vi.fn().mockResolvedValue(undefined),
  getPendingReports: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn().mockResolvedValue({
    totalUsers: 42, totalQuestions: 500, approvedQuestions: 480,
    pendingQuestions: 20, totalAttempts: 1200, activeSubscriptions: 85,
    pendingReports: 2, draftQuestions: 20,
  }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "נסה לחשוב על הקשר המילה במשפט." } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeCtx(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAuthCtx(role: "user" | "admin" = "user"): TrpcContext {
  return makeCtx({
    user: {
      id: 1, openId: "test-user", name: "Test User", email: "test@example.com",
      loginMethod: "email", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("clears cookie and returns success", async () => {
    const ctx = makeAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect((ctx.res.clearCookie as any).mock.calls.length).toBeGreaterThan(0);
  });
});

describe("subscription.plans", () => {
  it("returns the free demo and single premium plan with ILS pricing", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const plans = await caller.subscription.plans();
    expect(plans).toHaveLength(2);
    const premium = plans.find(p => p.slug === "premium");
    expect(premium).toBeDefined();
    expect(premium?.priceIls).toBe("99");
  });

  it("includes free trial plan", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const plans = await caller.subscription.plans();
    const free = plans.find(p => p.slug === "free");
    expect(free).toBeDefined();
    expect(free?.priceIls).toBe("0");
  });
});

describe("subscription.mySubscription", () => {
  it("returns null subscription for user without plan", async () => {
    vi.mocked(db.getUserWithPlan).mockResolvedValueOnce({ subscription: null, plan: null });
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.subscription.mySubscription();
    expect(result.subscription).toBeNull();
    expect(result.plan).toBeNull();
  });
});

describe("questions.list", () => {
  it("returns approved questions", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.questions.list({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("vocabulary");
    expect(result[0].status).toBe("approved");
  });

  it("returns questions with required fields", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.questions.list({ limit: 10 });
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("questionText");
    expect(result[0]).toHaveProperty("type");
  });
});

describe("questions.byId", () => {
  it("returns question by id with all fields", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.questions.byId({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.questionText).toContain("benevolent");
    expect(result).toHaveProperty("choiceA");
    expect(result).toHaveProperty("choiceB");
    expect(result).toHaveProperty("explanationHe");
  });
});

describe("exam.start", () => {
  it("creates an exam attempt for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.exam.start({ mode: "practice", questionCount: 10 });
    expect(result.attemptId).toBe(42);
    expect(result.questions).toHaveLength(1);
  });
});

describe("exam.submitAnswer", () => {
  it("returns whether answer is correct", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.exam.submitAnswer({
      attemptId: 42,
      questionId: 1,
      selectedAnswer: "A",
      timeTakenSeconds: 15,
    });
    expect(result.isCorrect).toBe(true);
    expect(result.correctAnswer).toBe("A");
    expect(result.explanationHe).toBeTruthy();
  });

  it("detects wrong answer", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.exam.submitAnswer({
      attemptId: 42,
      questionId: 1,
      selectedAnswer: "B",
      timeTakenSeconds: 20,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.correctAnswer).toBe("A");
  });
});

describe("exam.weaknessProfile", () => {
  it("returns weakness profile for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const profile = await caller.exam.weaknessProfile();
    expect(profile).toBeDefined();
    expect(profile?.estimatedScore).toBe(110);
    expect(parseFloat(String(profile?.vocabularyAccuracy))).toBeGreaterThan(0);
  });
});

describe("vocabulary.words", () => {
  it("returns vocabulary words", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const words = await caller.vocabulary.words({ limit: 10 });
    expect(words).toHaveLength(2);
    expect(words[0].word).toBe("benevolent");
    expect(words[0].translationHe).toBe("טוב לב");
  });
});

describe("vocabulary.updateProgress", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.vocabulary.updateProgress({ wordId: 1, masteryLevel: 3 })).rejects.toThrow();
  });

  it("saves mastery level for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.vocabulary.updateProgress({ wordId: 1, masteryLevel: 4 });
    expect(result.success).toBe(true);
  });
});

describe("hints.getHint", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.hints.getHint({ questionId: 1 })).rejects.toThrow();
  });

  it("returns a Hebrew hint for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.hints.getHint({ questionId: 1 });
    expect(result.hint).toBeTruthy();
    expect(typeof result.hint).toBe("string");
  });
});

describe("admin.stats", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("returns platform stats for admin", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("admin"));
    const stats = await caller.admin.stats();
    expect(stats.totalUsers).toBe(42);
    expect(stats.approvedQuestions).toBe(480);
    expect(stats.pendingQuestions).toBe(20);
  });
});

describe("admin.users", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("returns user list for admin", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("admin"));
    const users = await caller.admin.users();
    expect(Array.isArray(users)).toBe(true);
  });
});

describe("admin.approveQuestion", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.approveQuestion({ id: 1 })).rejects.toThrow();
  });

  it("approves question for admin", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("admin"));
    const result = await caller.admin.approveQuestion({ id: 1 });
    expect(result.success).toBe(true);
  });
});
