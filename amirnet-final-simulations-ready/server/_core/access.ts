import { TRPCError } from "@trpc/server";
import { getUserById, getUserWithPlan } from "../db";

export function isPremiumPlan(plan: { name?: string | null; priceIls?: string | number | null } | null | undefined) {
  return !!plan && (plan.name === "premium" || Number(plan.priceIls ?? 0) > 0);
}

export function isUnlockingStatus(status: unknown) {
  return status === "active" || status === "trial";
}

export function isPremiumUserRow(user: any) {
  return user?.premium === true || isUnlockingStatus(user?.subscriptionStatus);
}

export async function hasPremiumAccess(userId: number | string) {
  try {
    const user = await getUserById(userId as any);
    if (isPremiumUserRow(user)) return true;
  } catch {
    // Some tests/mock environments expose only subscription lookup. Production still checks user.premium first.
  }

  const current = await getUserWithPlan(userId as any);
  const subscription = current?.subscription;
  const plan = current?.plan;
  return isPremiumPlan(plan) && isUnlockingStatus(subscription?.status);
}

export async function requirePremiumAccess(userId: number | string) {
  if (await hasPremiumAccess(userId)) return;
  throw new TRPCError({
    code: "PAYMENT_REQUIRED",
    message: "נדרשת הרשמת פרימיום פעילה כדי לגשת לתוכן הזה.",
  });
}
