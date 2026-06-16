import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ENV } from "./env";
import { getPlanById, recordPayment, upsertProviderSubscription } from "../db";
import { notifyOwner } from "./notification";

type LemonWebhook = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, any>;
  };
};

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifySignature(rawBody: Buffer, signature: string | undefined) {
  if (!ENV.lemonSqueezyWebhookSecret) return false;
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", ENV.lemonSqueezyWebhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(digest, signature);
}

function parseDate(value: unknown, fallbackDays = 120) {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}

function mapSubscriptionStatus(status: string | undefined): "active" | "trial" | "past_due" | "cancelled" | "expired" {
  if (status === "active") return "active";
  if (status === "trialing" || status === "trial") return "trial";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "expired") return "expired";
  return "active";
}

function getCustom(payload: LemonWebhook) {
  return payload.meta?.custom_data ?? {};
}

export async function handleLemonSqueezyWebhook(req: Request, res: Response) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const signature = req.header("X-Signature") ?? undefined;

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid Lemon Squeezy signature" });
  }

  let payload: LemonWebhook;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const event = req.header("X-Event-Name") ?? payload.meta?.event_name ?? "unknown";
  const attributes = payload.data?.attributes ?? {};
  const custom = getCustom(payload);
  const userId = String(custom.userId ?? "");
  const planId = Number(custom.planId);

  if (!userId || !Number.isInteger(planId)) {
    // Return 200 so Lemon Squeezy does not retry forever, but log the mismatch.
    console.warn("[Billing] Webhook missing userId/planId custom_data", { event, custom });
    return res.status(200).json({ received: true, ignored: "missing-custom-data" });
  }

  const plan = await getPlanById(planId);
  if (!plan) return res.status(200).json({ received: true, ignored: "unknown-plan" });

  const providerSubscriptionId = String(attributes.subscription_id ?? attributes.id ?? payload.data?.id ?? "");
  const providerCustomerId = attributes.customer_id ? String(attributes.customer_id) : undefined;
  const providerOrderId = attributes.order_id ? String(attributes.order_id) : payload.data?.type === "orders" ? String(payload.data?.id ?? "") : undefined;
  const renewsAt = attributes.renews_at ?? attributes.ends_at ?? attributes.created_at;
  const status = event.includes("cancel") ? "cancelled" : event.includes("expired") ? "expired" : mapSubscriptionStatus(attributes.status);
  const expiresAt = status === "cancelled" || status === "expired" ? new Date() : parseDate(renewsAt, plan.durationDays || 120);

  if (event.startsWith("subscription_")) {
    await upsertProviderSubscription({
      userId,
      planId,
      provider: "lemonsqueezy",
      providerSubscriptionId,
      providerCustomerId,
      providerOrderId,
      status,
      expiresAt,
    });
  }

  if (event === "order_created" || event === "subscription_payment_success" || event === "subscription_payment_failed") {
    const amount = Number(attributes.total ?? attributes.total_usd ?? attributes.subtotal ?? 0) / 100;
    await recordPayment({
      userId,
      amountIls: String(Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : plan.priceIls),
      status: event === "subscription_payment_failed" ? "failed" : "succeeded",
      provider: "lemonsqueezy",
      providerPaymentId: String(payload.data?.id ?? attributes.identifier ?? ""),
      providerOrderId,
    });

    if (event === "order_created") {
      await upsertProviderSubscription({
        userId,
        planId,
        provider: "lemonsqueezy",
        providerSubscriptionId: providerSubscriptionId || `order_${payload.data?.id ?? Date.now()}`,
        providerCustomerId,
        providerOrderId,
        status: "active",
        expiresAt: parseDate(attributes.created_at, plan.durationDays || 120),
      });
    }
  }

  if (event === "subscription_created" || event === "order_created") {
    await notifyOwner({
      title: "תשלום חדש הופעל",
      content: `Lemon Squeezy הפעיל מנוי למשתמש ${userId}, מסלול ${plan.nameHe}`,
    });
  }

  return res.status(200).json({ received: true });
}
