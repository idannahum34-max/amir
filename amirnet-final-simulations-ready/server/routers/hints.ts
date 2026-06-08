import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getQuestionById } from "../db";
import { requirePremiumAccess } from "../_core/access";

export const hintsRouter = router({
  getHint: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requirePremiumAccess(ctx.user.id);
      const question = await getQuestionById(input.questionId);
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      const typeLabels: Record<string, string> = {
        vocabulary: "אוצר מילים",
        sentence_completion: "השלמת משפטים",
        restatement: "ניסוח מחדש",
        reading_comprehension: "הבנת הנקרא",
      };

      const prompt = `אתה מורה לאנגלית המסייע לתלמידים ישראלים להתכונן לבחינת אמירנט.
      
שאלה מסוג ${typeLabels[question.type] ?? question.type}:
"${question.questionText}"

תשובות אפשריות:
א) ${question.choiceA}
ב) ${question.choiceB}
ג) ${question.choiceC}
ד) ${question.choiceD}

תן רמז מועיל בעברית שיעזור לתלמיד להגיע לתשובה הנכונה מבלי לחשוף אותה ישירות.
הרמז צריך להיות קצר (2-3 משפטים), ברור, ומעודד.
אל תציין מה התשובה הנכונה.`;

      const fallbackHint = (() => {
        if (question.type === "sentence_completion") {
          return "חפש/י את מילת הקישור ואת הטון של המשפט. אחר כך בדוק/י איזו תשובה משלימה את ההיגיון בלי לשנות את המשמעות.";
        }
        if (question.type === "restatement") {
          return "נסח/י לעצמך בעברית את הרעיון המרכזי של המשפט המקורי, ואז פסול/י תשובות שמוסיפות מידע חדש או משנות את היחס הלוגי.";
        }
        if (question.type === "reading_comprehension") {
          return "חזור/י למשפטים סביב הרעיון המרכזי בקטע. התשובה הנכונה בדרך כלל נשענת על ניסוח מחדש של פרט מהטקסט, לא על ידע חיצוני.";
        }
        return "נסה/י לזהות את השורש או ההקשר של המילה, ואז פסול/י קודם את שתי התשובות שהכי פחות מתאימות למשפט.";
      })();

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "אתה מורה לאנגלית מנוסה המסייע לתלמידים ישראלים." },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const hint = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((c: any) => c.text ?? "").join("") : fallbackHint;
        return { hint: hint || fallbackHint };
      } catch (error) {
        console.warn("[hints] LLM unavailable; using deterministic fallback", error);
        return { hint: fallbackHint };
      }
    }),
});
