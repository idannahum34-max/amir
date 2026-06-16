
-- AmirNet professional diverse seed. Safe to rerun.
-- Run files in SUPABASE_SEED_PARTS by order.
create extension if not exists pgcrypto;

alter table if exists users alter column id type text using id::text;
alter table if exists users alter column id set default gen_random_uuid()::text;
alter table if exists users add column if not exists "openId" text;
alter table if exists users add column if not exists name text;
alter table if exists users add column if not exists email text;
alter table if exists users add column if not exists "loginMethod" text default 'email';
alter table if exists users add column if not exists "passwordHash" text;
alter table if exists users add column if not exists role text default 'user';
alter table if exists users add column if not exists premium boolean default false;
alter table if exists users add column if not exists "subscriptionStatus" text default 'free';
alter table if exists users add column if not exists "subscriptionProvider" text;
alter table if exists users add column if not exists "subscriptionId" text;
alter table if exists users add column if not exists "currentPeriodEnd" timestamp;
alter table if exists users add column if not exists "planType" text;
alter table if exists users add column if not exists "lemonCustomerId" text;
alter table if exists users add column if not exists "createdAt" timestamp default now();
alter table if exists users add column if not exists "updatedAt" timestamp default now();
alter table if exists users add column if not exists "lastSignedIn" timestamp default now();
alter table if exists users alter column email drop not null;
alter table if exists users drop constraint if exists users_email_key;
drop index if exists users_email_unique_idx;
create unique index if not exists users_email_unique_idx on users(email) where email is not null;
drop index if exists users_openid_unique_idx;
create unique index if not exists users_openid_unique_idx on users("openId") where "openId" is not null;

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

create table if not exists subscriptions (
  id serial primary key,
  "userId" text not null,
  "planId" integer not null,
  "stripeSubscriptionId" varchar(256),
  "stripeCustomerId" varchar(256),
  provider varchar(64) default 'manual',
  "providerSubscriptionId" varchar(256),
  "providerCustomerId" varchar(256),
  "providerOrderId" varchar(256),
  status text default 'trial' not null,
  "startedAt" timestamp default now() not null,
  "expiresAt" timestamp default (now() + interval '14 days') not null,
  "cancelledAt" timestamp,
  "createdAt" timestamp default now() not null,
  "updatedAt" timestamp default now() not null
);
alter table subscriptions alter column "userId" type text using "userId"::text;

create table if not exists payments (
  id serial primary key,
  "userId" text not null,
  "subscriptionId" integer,
  "stripePaymentIntentId" varchar(256),
  provider varchar(64) default 'manual',
  "providerPaymentId" varchar(256),
  "providerOrderId" varchar(256),
  "amountIls" numeric(10,2) not null,
  status text default 'pending' not null,
  "createdAt" timestamp default now() not null
);
alter table payments alter column "userId" type text using "userId"::text;

create table if not exists passages (
  id serial primary key,
  title text,
  body text not null,
  "wordCount" integer,
  difficulty integer default 5,
  topic varchar(128),
  status text default 'approved' not null,
  "createdAt" timestamp default now() not null,
  "updatedAt" timestamp default now() not null
);

create table if not exists questions (
  id serial primary key,
  type text not null,
  difficulty integer default 5 not null,
  "questionText" text not null,
  "choiceA" text not null,
  "choiceB" text not null,
  "choiceC" text not null,
  "choiceD" text not null,
  "correctAnswer" text not null,
  "explanationHe" text,
  "whyWrongAHe" text,
  "whyWrongBHe" text,
  "whyWrongCHe" text,
  "whyWrongDHe" text,
  tags jsonb default '[]'::jsonb,
  "estimatedTimeSec" integer default 45,
  "cefrLevel" varchar(8),
  "passageId" integer,
  status text default 'approved' not null,
  "isPilot" boolean default false,
  "reportCount" integer default 0,
  "createdAt" timestamp default now() not null,
  "updatedAt" timestamp default now() not null
);

create table if not exists exams (
  id serial primary key,
  name varchar(256) not null,
  "nameHe" varchar(256),
  "totalQuestions" integer default 50,
  "timeLimitMinutes" integer default 50,
  "isAdaptive" boolean default false,
  "isSimulation" boolean default true,
  "createdAt" timestamp default now() not null
);

create table if not exists exam_attempts (
  id serial primary key,
  "userId" text not null,
  "examId" integer,
  mode text default 'practice' not null,
  status text default 'in_progress' not null,
  score integer,
  "estimatedAmirnetScore" integer,
  "totalQuestions" integer default 0,
  "correctAnswers" integer default 0,
  "timeTakenSeconds" integer,
  "startedAt" timestamp default now() not null,
  "completedAt" timestamp,
  "questionIds" jsonb default '[]'::jsonb
);
alter table exam_attempts alter column "userId" type text using "userId"::text;

create table if not exists answers (
  id serial primary key,
  "attemptId" integer not null,
  "userId" text not null,
  "questionId" integer not null,
  "selectedAnswer" text,
  "isCorrect" boolean,
  "timeTakenSeconds" integer,
  "usedHint" boolean default false,
  "answeredAt" timestamp default now() not null
);
alter table answers alter column "userId" type text using "userId"::text;

create table if not exists user_weakness_profiles (
  id serial primary key,
  "userId" text not null unique,
  "vocabularyAccuracy" numeric(5,2) default 0,
  "sentenceCompletionAccuracy" numeric(5,2) default 0,
  "restatementAccuracy" numeric(5,2) default 0,
  "readingComprehensionAccuracy" numeric(5,2) default 0,
  "avgTimeSec" numeric(6,2) default 0,
  "weakTags" jsonb default '[]'::jsonb,
  "estimatedScore" integer default 100,
  "streakDays" integer default 0,
  "lastPracticeAt" timestamp,
  "totalQuestionsAnswered" integer default 0,
  "updatedAt" timestamp default now() not null
);
alter table user_weakness_profiles alter column "userId" type text using "userId"::text;

create table if not exists vocabulary_words (
  id serial primary key,
  word varchar(128) not null,
  definition text not null,
  "definitionHe" text not null,
  "exampleSentence" text,
  difficulty integer default 5,
  "cefrLevel" varchar(8),
  tags jsonb default '[]'::jsonb,
  "audioUrl" varchar(512),
  frequency integer default 1,
  "createdAt" timestamp default now() not null
);

create table if not exists question_reports (
  id serial primary key,
  "userId" text not null,
  "questionId" integer not null,
  reason varchar(512),
  status text default 'pending' not null,
  "createdAt" timestamp default now() not null
);

-- Keep billing/users, rebuild learning content only.
delete from answers;
delete from exam_attempts;
delete from questions;
delete from passages;
delete from exams;
delete from vocabulary_words;
alter sequence if exists questions_id_seq restart with 1;
alter sequence if exists passages_id_seq restart with 1;
alter sequence if exists exams_id_seq restart with 1;
alter sequence if exists vocabulary_words_id_seq restart with 1;

insert into subscription_plans (id,name,"nameHe","priceIls","durationDays","lemonSqueezyVariantId","isActive")
values (3,'premium','ניסיון חינם ואז פרימיום',99,30,'1710097',true)
on conflict (id) do update set name=excluded.name,"nameHe"=excluded."nameHe","priceIls"=excluded."priceIls","durationDays"=excluded."durationDays","lemonSqueezyVariantId"=excluded."lemonSqueezyVariantId","isActive"=true;
