import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createExamAttempt,
  finishAttempt,
  getApprovedQuestions,
  getAttemptById,
  getAnswersForAttempt,
  getOrCreateWeaknessProfile,
  getUserAttempts,
  getSimulationExams,
  getSimulationQuestions,
  saveAnswer,
  updateWeaknessProfile,
} from "../db";
import { requirePremiumAccess } from "../_core/access";

// Estimate AMIRNET score (100-150 scale) from percentage correct
function estimateAmirnetScore(correctPct: number): number {
  // AMIRNET scores range roughly 100-150
  return Math.round(100 + (correctPct / 100) * 50);
}

// Adaptive question selection: weight weak areas more
async function selectAdaptiveQuestions(userId: number | string, count: number) {
  const profile = await getOrCreateWeaknessProfile(userId);
  const types = ["sentence_completion", "restatement", "reading_comprehension"] as const;

  // Build weighted distribution based on accuracy (lower accuracy = more questions)
  const accuracies: Record<string, number> = {
    sentence_completion: parseFloat(String(profile?.sentenceCompletionAccuracy ?? "50")),
    restatement: parseFloat(String(profile?.restatementAccuracy ?? "50")),
    reading_comprehension: parseFloat(String(profile?.readingComprehensionAccuracy ?? "50")),
  };

  const weights = types.map(t => Math.max(1, 100 - accuracies[t]));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map(w => Math.max(1, Math.round((w / totalWeight) * count)));

  const allQuestions: any[] = [];
  for (let i = 0; i < types.length; i++) {
    const qs = await getApprovedQuestions({ type: types[i], limit: counts[i] });
    allQuestions.push(...qs);
  }

  // Shuffle
  return allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
}

export const examRouter = router({
  simulations: protectedProcedure.query(async ({ ctx }) => {
    await requirePremiumAccess(ctx.user.id);
    return getSimulationExams();
  }),

  start: protectedProcedure
    .input(z.object({
      mode: z.enum(["practice", "adaptive", "simulation"]),
      type: z.enum(["vocabulary", "sentence_completion", "restatement", "reading_comprehension"]).optional(),
      count: z.number().min(5).max(200).default(50),
      simulationId: z.number().min(1).max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      let questionList: any[];

      if (input.mode === "adaptive") {
        questionList = await selectAdaptiveQuestions(ctx.user.id, input.count);
      } else if (input.mode === "simulation") {
        const simulationId = input.simulationId ?? 1;
        questionList = await getSimulationQuestions(simulationId, 50);
        if (questionList.length < 50) {
          // Fallback keeps production usable if the seed was not fully loaded.
          const [sentences, restatements, reading] = await Promise.all([
            getApprovedQuestions({ type: "sentence_completion", limit: 20 }),
            getApprovedQuestions({ type: "restatement", limit: 20 }),
            getApprovedQuestions({ type: "reading_comprehension", limit: 10 }),
          ]);
          questionList = [...sentences, ...restatements, ...reading].slice(0, 50);
        }
      } else {
        questionList = await getApprovedQuestions({ type: input.type, limit: input.count });
      }

      if (questionList.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No questions available" });
      }

      const questionIds = questionList.map((q: any) => q.id);
      const attemptId = await createExamAttempt({
        userId: ctx.user.id,
        mode: input.mode,
        examId: input.mode === "simulation" ? input.simulationId : undefined,
        questionIds,
      });

      return { attemptId, questions: questionList };
    }),

  submitAnswer: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      questionId: z.number(),
      selectedAnswer: z.enum(["A", "B", "C", "D"]),
      timeTakenSeconds: z.number().min(0).max(600),
      usedHint: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const attempt = await getAttemptById(input.attemptId);
      if (!attempt || String(attempt.userId) !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (attempt.status !== "in_progress") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt already completed" });
      }

      // Get question to check correctness
      const { getQuestionById } = await import("../db");
      const question = await getQuestionById(input.questionId);
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      const isCorrect = question.correctAnswer === input.selectedAnswer;

      await saveAnswer({
        attemptId: input.attemptId,
        userId: ctx.user.id,
        questionId: input.questionId,
        selectedAnswer: input.selectedAnswer,
        isCorrect,
        timeTakenSeconds: input.timeTakenSeconds,
        usedHint: input.usedHint,
      });

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanationHe: question.explanationHe,
        whyWrongAHe: question.whyWrongAHe,
        whyWrongBHe: question.whyWrongBHe,
        whyWrongCHe: question.whyWrongCHe,
        whyWrongDHe: question.whyWrongDHe,
      };
    }),

  finish: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      timeTakenSeconds: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const attempt = await getAttemptById(input.attemptId);
      if (!attempt || String(attempt.userId) !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const answersList = await getAnswersForAttempt(input.attemptId);
      const correct = answersList.filter(a => a.isCorrect).length;
      const total = answersList.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      const estimated = estimateAmirnetScore(score);

      await finishAttempt(input.attemptId, {
        score,
        estimatedAmirnetScore: estimated,
        correctAnswers: correct,
        timeTakenSeconds: input.timeTakenSeconds,
      });

      // Update weakness profile
      const profile = await getOrCreateWeaknessProfile(ctx.user.id);
      if (profile) {
        const byType: Record<string, { correct: number; total: number }> = {};
        for (const ans of answersList) {
          const { getQuestionById } = await import("../db");
          const q = await getQuestionById(ans.questionId);
          if (!q) continue;
          if (!byType[q.type]) byType[q.type] = { correct: 0, total: 0 };
          byType[q.type].total++;
          if (ans.isCorrect) byType[q.type].correct++;
        }

        const updates: any = {
          totalQuestionsAnswered: (profile.totalQuestionsAnswered ?? 0) + total,
          lastPracticeAt: new Date(),
          estimatedScore: estimated,
        };

        if (byType.vocabulary) {
          updates.vocabularyAccuracy = String(Math.round((byType.vocabulary.correct / byType.vocabulary.total) * 100));
        }
        if (byType.sentence_completion) {
          updates.sentenceCompletionAccuracy = String(Math.round((byType.sentence_completion.correct / byType.sentence_completion.total) * 100));
        }
        if (byType.restatement) {
          updates.restatementAccuracy = String(Math.round((byType.restatement.correct / byType.restatement.total) * 100));
        }
        if (byType.reading_comprehension) {
          updates.readingComprehensionAccuracy = String(Math.round((byType.reading_comprehension.correct / byType.reading_comprehension.total) * 100));
        }

        await updateWeaknessProfile(ctx.user.id, updates);
      }

      return { score, estimatedAmirnetScore: estimated, correct, total };
    }),

  myAttempts: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      return getUserAttempts(ctx.user.id, input?.limit ?? 10);
    }),

  attemptDetail: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const attempt = await getAttemptById(input.attemptId);
      if (!attempt || String(attempt.userId) !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const answersList = await getAnswersForAttempt(input.attemptId);
      return { attempt, answers: answersList };
    }),

  weaknessProfile: protectedProcedure.query(async ({ ctx }) => {
    await requirePremiumAccess(ctx.user.id);
    return getOrCreateWeaknessProfile(ctx.user.id);
  }),
});
