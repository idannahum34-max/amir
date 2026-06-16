import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { questionsRouter } from "./routers/questions";
import { examRouter } from "./routers/exam";
import { subscriptionRouter } from "./routers/subscription";
import { vocabularyRouter } from "./routers/vocabulary";
import { adminRouter } from "./routers/admin";
import { hintsRouter } from "./routers/hints";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  questions: questionsRouter,
  exam: examRouter,
  subscription: subscriptionRouter,
  vocabulary: vocabularyRouter,
  admin: adminRouter,
  hints: hintsRouter,
});

export type AppRouter = typeof appRouter;
