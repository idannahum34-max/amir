import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAdminStats,
  getAllUsers,
  getPendingReports,
  getQuestionsForAdmin,
  getVocabularyForAdmin,
  updateQuestionStatus,
  upsertQuestion,
  upsertVocabularyWord,
} from "../db";

const questionInput = z.object({
  id: z.number().optional(),
  type: z.enum(["vocabulary", "sentence_completion", "restatement", "reading_comprehension"]),
  difficulty: z.number().min(1).max(10),
  questionText: z.string().min(5),
  choiceA: z.string().min(1),
  choiceB: z.string().min(1),
  choiceC: z.string().min(1),
  choiceD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanationHe: z.string().optional(),
  cefrLevel: z.string().optional(),
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
});

const vocabularyInput = z.object({
  id: z.number().optional(),
  word: z.string().min(1).max(128),
  definition: z.string().min(1),
  definitionHe: z.string().min(1),
  exampleSentence: z.string().optional(),
  difficulty: z.number().min(1).max(10).default(5),
  cefrLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  frequency: z.number().min(0).default(1),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    return getAdminStats();
  }),

  users: adminProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      return getAllUsers(input?.limit ?? 100, input?.offset ?? 0);
    }),

  questions: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "approved", "rejected"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      return getQuestionsForAdmin(input ?? {});
    }),

  approveQuestion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateQuestionStatus(input.id, "approved");
      return { success: true };
    }),

  rejectQuestion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateQuestionStatus(input.id, "rejected");
      return { success: true };
    }),

  upsertQuestion: adminProcedure
    .input(questionInput)
    .mutation(async ({ input }) => {
      await upsertQuestion(input);
      return { success: true };
    }),

  bulkImportQuestions: adminProcedure
    .input(z.object({ questions: z.array(questionInput).min(1).max(1000) }))
    .mutation(async ({ input }) => {
      for (const question of input.questions) await upsertQuestion(question);
      return { success: true, imported: input.questions.length };
    }),

  vocabulary: adminProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => getVocabularyForAdmin(input ?? {})),

  upsertVocabulary: adminProcedure
    .input(vocabularyInput)
    .mutation(async ({ input }) => {
      await upsertVocabularyWord({ ...input, tags: input.tags ?? [] });
      return { success: true };
    }),

  bulkImportVocabulary: adminProcedure
    .input(z.object({ words: z.array(vocabularyInput).min(1).max(2000) }))
    .mutation(async ({ input }) => {
      for (const word of input.words) await upsertVocabularyWord({ ...word, tags: word.tags ?? [] });
      return { success: true, imported: input.words.length };
    }),

  reports: adminProcedure.query(async () => {
    return getPendingReports();
  }),
});
