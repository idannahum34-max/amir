import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getApprovedQuestions,
  getAnswersForAttempt,
  getPassageById,
  getQuestionById,
  getSavedQuestions,
  getUserAnswerHistory,
  reportQuestion,
  toggleSavedQuestion,
} from "../db";
import { requirePremiumAccess } from "../_core/access";

export const questionsRouter = router({
  demoList: publicProcedure
    .query(async () => {
      return getApprovedQuestions({ limit: 50, maxDifficulty: 6 });
    }),

  list: protectedProcedure
    .input(z.object({
      type: z.enum(["vocabulary", "sentence_completion", "restatement", "reading_comprehension"]).optional(),
      minDifficulty: z.number().min(1).max(10).optional(),
      maxDifficulty: z.number().min(1).max(10).optional(),
      limit: z.number().min(1).max(200).default(100),
    }).optional())
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      return getApprovedQuestions(input ?? {});
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const q = await getQuestionById(input.id);
      if (!q) throw new Error("Question not found");
      let passage = null;
      if (q.passageId) passage = await getPassageById(q.passageId);
      return { ...q, passage };
    }),

  saved: protectedProcedure.query(async ({ ctx }) => {
    await requirePremiumAccess(ctx.user.id);
    return getSavedQuestions(ctx.user.id);
  }),

  toggleSave: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const saved = await toggleSavedQuestion(ctx.user.id, input.questionId);
      return { saved };
    }),

  report: protectedProcedure
    .input(z.object({ questionId: z.number(), reason: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      await reportQuestion(ctx.user.id, input.questionId, input.reason);
      return { success: true };
    }),

  history: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      return getUserAnswerHistory(ctx.user.id, input?.limit ?? 50);
    }),
});
