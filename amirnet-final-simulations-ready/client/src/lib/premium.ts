export function isPremiumUser(user: unknown): boolean {
  const u = user as Record<string, unknown> | null | undefined;
  if (!u) return false;
  return u.premium === true || u.subscriptionStatus === "active" || u.subscriptionStatus === "trial";
}

export function isActiveSubscription(myPlan: unknown): boolean {
  const p = myPlan as { subscription?: { status?: string | null } | null; plan?: { priceIls?: unknown } | null } | null | undefined;
  const status = String(p?.subscription?.status ?? "");
  return !!p?.subscription && ["active", "trial"].includes(status) && Number(p?.plan?.priceIls ?? 0) > 0;
}

export function hasPremiumAccess(user: unknown, myPlan: unknown): boolean {
  return isPremiumUser(user) || isActiveSubscription(myPlan);
}
