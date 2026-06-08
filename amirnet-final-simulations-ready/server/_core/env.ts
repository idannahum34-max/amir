const cookieSecret = process.env.COOKIE_SECRET ?? process.env.JWT_SECRET;

export const ENV = {
  appId: process.env.APP_ID ?? "amirnet-prep",
  cookieSecret: cookieSecret ?? "dev-cookie-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: (process.env.OWNER_EMAIL ?? "").trim().toLowerCase(),
  isProduction: process.env.NODE_ENV === "production",
  openaiApiUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY ?? "",
  lemonSqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID ?? "",
  lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "",
  lemonSqueezyVariantBasic: process.env.LEMONSQUEEZY_VARIANT_BASIC ?? "",
  lemonSqueezyVariantPremium: process.env.LEMONSQUEEZY_VARIANT_PREMIUM ?? "",
  lemonSqueezyVariantFull: process.env.LEMONSQUEEZY_VARIANT_FULL ?? "",
  lemonSqueezyVariantId: process.env.LEMONSQUEEZY_VARIANT_ID ?? "",
  allowMockBilling: process.env.ALLOW_MOCK_BILLING === "true",
  forgeApiUrl: process.env.EXTERNAL_SERVICE_API_URL ?? "",
  forgeApiKey: process.env.EXTERNAL_SERVICE_API_KEY ?? "",
};
