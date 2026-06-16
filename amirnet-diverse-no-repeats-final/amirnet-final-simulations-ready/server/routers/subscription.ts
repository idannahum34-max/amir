import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import {
  createSubscription,
  getPlanById,
  getSubscriptionPlans,
  getUserWithPlan,
} from "../db";
import { notifyOwner } from "../_core/notification";

const variantByPlanName: Record<string, keyof typeof ENV> = {
  basic: "lemonSqueezyVariantBasic",
  premium: "lemonSqueezyVariantPremium",
  military: "lemonSqueezyVariantFull",
};

function getVariantId(plan: { name: string; lemonSqueezyVariantId?: string | null }) {
  return plan.lemonSqueezyVariantId || ENV.lemonSqueezyVariantId || String(ENV[variantByPlanName[plan.name] ?? "lemonSqueezyVariantPremium"] || "");
}

async function createLemonSqueezyCheckout(input: {
  plan: NonNullable<Awaited<ReturnType<typeof getPlanById>>>;
  user: { id: number; email?: string | null; name?: string | null };
  origin: string;
}) {
  if (!ENV.lemonSqueezyApiKey || !ENV.lemonSqueezyStoreId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Billing is not configured. Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID.",
    });
  }

  const variantId = getVariantId(input.plan as any);
  if (!variantId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Missing Lemon Squeezy variant id for plan '${input.plan.name}'.`,
    });
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${ENV.lemonSqueezyApiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.user.email ?? undefined,
            name: input.user.name ?? undefined,
            custom: {
              userId: String(input.user.id),
              planId: String(input.plan.id),
              planName: input.plan.name,
            },
          },
          product_options: {
            redirect_url: `${input.origin}/billing/success`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(ENV.lemonSqueezyStoreId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: payload?.errors?.[0]?.detail ?? payload?.message ?? "Failed to create Lemon Squeezy checkout.",
    });
  }

  const url = payload?.data?.attributes?.url;
  if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Checkout URL was not returned." });
  return url as string;
}

export const subscriptionRouter = router({
  plans: publicProcedure.query(async () => {
    return getSubscriptionPlans();
  }),

  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    return getUserWithPlan(ctx.user.id);
  }),

  checkout: protectedProcedure
    .input(z.object({
      planId: z.number(),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = await getPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      if (Number(plan.priceIls) === 0) {
        const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
        await createSubscription({ userId: ctx.user.id, planId: plan.id, expiresAt, status: "trial", provider: "manual" });
        await notifyOwner({
          title: "ניסיון חינמי חדש",
          content: `משתמש ${ctx.user.name ?? ctx.user.email ?? ctx.user.id} התחיל ניסיון חינמי`,
        });
        return { success: true, redirectUrl: `${input.origin}/dashboard` };
      }

      const redirectUrl = await createLemonSqueezyCheckout({ plan, user: ctx.user, origin: input.origin });
      return { success: true, redirectUrl };
    }),

  // Development-only fallback. Never expose mock activation in production.
  activate: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ENV.isProduction || !ENV.allowMockBilling) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Mock billing activation is disabled." });
      }
      const plan = await getPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      await createSubscription({ userId: ctx.user.id, planId: plan.id, expiresAt, status: "active", provider: "mock" });
      return { success: true };
    }),
});
