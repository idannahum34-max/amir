-- Required user premium columns for premium gating after Lemon Squeezy checkout/webhook.
alter table users add column if not exists premium boolean default false not null;
alter table users add column if not exists "subscriptionStatus" varchar(64) default 'free';
alter table users add column if not exists "subscriptionProvider" varchar(64);
alter table users add column if not exists "subscriptionId" varchar(256);
alter table users add column if not exists "currentPeriodEnd" timestamp;
alter table users add column if not exists "planType" varchar(64);
alter table users add column if not exists "lemonCustomerId" varchar(256);

-- Ensure the single premium plan exists for checkout.
create table if not exists subscription_plans (
  id serial primary key,
  name varchar(64) not null,
  "nameHe" varchar(128) not null,
  "priceIls" numeric(10,2) not null,
  "durationDays" integer not null,
  "stripePriceId" varchar(128),
  "lemonSqueezyVariantId" varchar(128),
  "maxExamsPerMonth" integer default 999,
  "maxQuestionsPerDay" integer default 999,
  "hasAdaptiveLearning" boolean default true,
  "hasVocabularyModule" boolean default true,
  "hasDetailedAnalytics" boolean default true,
  "hasAiHints" boolean default true,
  "isMilitary" boolean default false,
  "isActive" boolean default true,
  "createdAt" timestamp default now() not null
);

insert into subscription_plans (
  id, name, "nameHe", "priceIls", "durationDays",
  "lemonSqueezyVariantId", "maxExamsPerMonth", "maxQuestionsPerDay",
  "hasAdaptiveLearning", "hasVocabularyModule", "hasDetailedAnalytics", "hasAiHints", "isActive"
)
values (
  3, 'premium', '14 יום ניסיון ואז פרימיום', 99, 30,
  '1710097', 999, 999, true, true, true, true, true
)
on conflict (id) do update set
  name = excluded.name,
  "nameHe" = excluded."nameHe",
  "priceIls" = excluded."priceIls",
  "durationDays" = excluded."durationDays",
  "lemonSqueezyVariantId" = excluded."lemonSqueezyVariantId",
  "maxExamsPerMonth" = excluded."maxExamsPerMonth",
  "maxQuestionsPerDay" = excluded."maxQuestionsPerDay",
  "hasAdaptiveLearning" = excluded."hasAdaptiveLearning",
  "hasVocabularyModule" = excluded."hasVocabularyModule",
  "hasDetailedAnalytics" = excluded."hasDetailedAnalytics",
  "hasAiHints" = excluded."hasAiHints",
  "isActive" = true;
