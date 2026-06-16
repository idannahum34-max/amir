import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getVocabProgress, getVocabularyWords, upsertVocabProgress } from "../db";
import { requirePremiumAccess } from "../_core/access";

export const vocabularyRouter = router({
  words: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
      difficulty: z.number().min(1).max(10).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      return getVocabularyWords(input ?? {});
    }),

  myProgress: protectedProcedure.query(async ({ ctx }) => {
    await requirePremiumAccess(ctx.user.id);
    return getVocabProgress(ctx.user.id);
  }),

  updateProgress: protectedProcedure
    .input(z.object({
      wordId: z.number(),
      masteryLevel: z.number().min(0).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      await upsertVocabProgress(ctx.user.id, input.wordId, input.masteryLevel);
      return { success: true };
    }),

  // Get words due for review (spaced repetition)
  dueForReview: protectedProcedure.query(async ({ ctx }) => {
    await requirePremiumAccess(ctx.user.id);
    const progress = await getVocabProgress(ctx.user.id);
    const now = new Date();
    const dueIds = progress
      .filter(p => !p.nextReviewAt || p.nextReviewAt <= now)
      .map(p => p.wordId);
    if (dueIds.length === 0) return [];
    const words = await getVocabularyWords({ limit: 20 });
    return words.filter(w => dueIds.includes(w.id));
  }),
});
