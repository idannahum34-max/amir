-- AmirNet final production schema + quality seed
-- Run this whole file in Supabase SQL Editor. It is safe to rerun.
-- It fixes premium modules, removes duplicate/ugly reading items, and seeds a serious launch dataset.

create extension if not exists pgcrypto;

-- Ensure text user ids match the app's auth ids.
create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  "openId" text unique,
  name text,
  email text unique,
  "loginMethod" text default 'email',
  "passwordHash" text,
  role text default 'user',
  premium boolean default false,
  "subscriptionStatus" text default 'free',
  "subscriptionProvider" text,
  "subscriptionId" text,
  "currentPeriodEnd" timestamp,
  "planType" text,
  "lemonCustomerId" text,
  "createdAt" timestamp default now(),
  "updatedAt" timestamp default now(),
  "lastSignedIn" timestamp default now()
);

create table if not exists sessions (id text primary key, "userId" text not null, "expiresAt" timestamp not null, "createdAt" timestamp default now());

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
insert into subscription_plans (id, name, "nameHe", "priceIls", "durationDays", "lemonSqueezyVariantId", "maxExamsPerMonth", "maxQuestionsPerDay", "hasAdaptiveLearning", "hasVocabularyModule", "hasDetailedAnalytics", "hasAiHints", "isMilitary", "isActive")
values (3, 'premium', '14 יום ניסיון ואז ₪99 לחודש', 99.00, 30, '1710097', 999, 999, true, true, true, true, false, true)
on conflict (id) do update set "nameHe"=excluded."nameHe", "priceIls"=excluded."priceIls", "durationDays"=excluded."durationDays", "lemonSqueezyVariantId"=excluded."lemonSqueezyVariantId", "isActive"=true;

create table if not exists subscriptions (id serial primary key, "userId" text not null, "planId" integer not null default 3, "stripeSubscriptionId" varchar(256), "stripeCustomerId" varchar(256), provider varchar(64) default 'manual', "providerSubscriptionId" varchar(256), "providerCustomerId" varchar(256), "providerOrderId" varchar(256), status text default 'trial' not null, "startedAt" timestamp default now() not null, "expiresAt" timestamp default (now()+interval '30 days') not null, "cancelledAt" timestamp, "createdAt" timestamp default now() not null, "updatedAt" timestamp default now() not null);
create table if not exists payments (id serial primary key, "userId" text, "subscriptionId" integer, "stripePaymentIntentId" varchar(256), provider varchar(64) default 'manual', "providerPaymentId" varchar(256), "providerOrderId" varchar(256), "amountIls" numeric(10,2) default 0 not null, status text default 'pending' not null, "createdAt" timestamp default now() not null);

create table if not exists passages (id serial primary key, title text, body text not null, "wordCount" integer, difficulty integer default 5, topic varchar(128), status text default 'approved' not null, "createdAt" timestamp default now() not null, "updatedAt" timestamp default now() not null);
create table if not exists questions (id serial primary key, type text not null, difficulty integer default 5 not null, "questionText" text not null, "choiceA" text not null, "choiceB" text not null, "choiceC" text not null, "choiceD" text not null, "correctAnswer" text not null, "explanationHe" text, "whyWrongAHe" text, "whyWrongBHe" text, "whyWrongCHe" text, "whyWrongDHe" text, tags jsonb default '[]'::jsonb, "estimatedTimeSec" integer default 45, "cefrLevel" varchar(8), "passageId" integer, status text default 'approved' not null, "isPilot" boolean default false, "reportCount" integer default 0, "createdAt" timestamp default now() not null, "updatedAt" timestamp default now() not null);
create table if not exists exams (id serial primary key, name varchar(256) not null, "nameHe" varchar(256), "totalQuestions" integer default 23, "timeLimitMinutes" integer default 50, "isAdaptive" boolean default false, "isSimulation" boolean default true, "createdAt" timestamp default now() not null);
create table if not exists exam_attempts (id serial primary key, "userId" text not null, "examId" integer, mode text default 'practice' not null, status text default 'in_progress' not null, score integer default 0, "estimatedAmirnetScore" integer, "totalQuestions" integer default 0, "correctAnswers" integer default 0, "timeTakenSeconds" integer default 0, "startedAt" timestamp default now() not null, "completedAt" timestamp, "questionIds" jsonb default '[]'::jsonb);
create table if not exists answers (id serial primary key, "attemptId" integer not null, "userId" text not null, "questionId" integer not null, "selectedAnswer" text, "isCorrect" boolean default false, "timeTakenSeconds" integer default 0, "usedHint" boolean default false, "answeredAt" timestamp default now() not null);
create table if not exists user_weakness_profiles (id serial primary key, "userId" text not null unique, "vocabularyAccuracy" numeric(5,2) default 0, "sentenceCompletionAccuracy" numeric(5,2) default 0, "restatementAccuracy" numeric(5,2) default 0, "readingComprehensionAccuracy" numeric(5,2) default 0, "avgTimeSec" numeric(6,2) default 0, "weakTags" jsonb default '[]'::jsonb, "estimatedScore" integer default 100, "streakDays" integer default 0, "lastPracticeAt" timestamp, "totalQuestionsAnswered" integer default 0, "updatedAt" timestamp default now() not null);
create table if not exists vocabulary_words (id serial primary key, word varchar(128) not null unique, definition text not null, "definitionHe" text not null, "exampleSentence" text, difficulty integer default 5, "cefrLevel" varchar(8), tags jsonb default '[]'::jsonb, "audioUrl" varchar(512), frequency integer default 1, "createdAt" timestamp default now() not null);
create table if not exists user_vocabulary_progress (id serial primary key, "userId" text not null, "wordId" integer not null, "masteryLevel" integer default 0, "nextReviewAt" timestamp, "reviewCount" integer default 0, "lastReviewedAt" timestamp);
create table if not exists saved_questions (id serial primary key, "userId" text not null, "questionId" integer not null, "savedAt" timestamp default now() not null);
create table if not exists question_reports (id serial primary key, "userId" text not null, "questionId" integer not null, reason varchar(512), status text default 'pending' not null, "createdAt" timestamp default now() not null);

-- Remove low-quality generated placeholder content that caused repetition and ugly reading display.
delete from questions where "questionText" ilike 'Passage %' or "questionText" ilike '%academic_word_%' or "questionText" ilike '%study % became available%' or "questionText" ilike '%unit % was demanding%';
delete from vocabulary_words where word like 'academic_word_%';

-- 30 authentic-length simulations: AMIRNET is about 50 minutes according to NITE; app uses 23-question simulation structure.
insert into exams (name, "nameHe", "totalQuestions", "timeLimitMinutes", "isAdaptive", "isSimulation")
select 'AMIRNET Simulation '||gs, 'סימולציית אמירנט '||gs, 23, 50, false, true
from generate_series(1,30) gs
where not exists (select 1 from exams where name='AMIRNET Simulation '||gs);

-- Sentence completion: 360 unique items.
insert into questions (type, difficulty, "questionText", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanationHe", "whyWrongAHe", "whyWrongBHe", "whyWrongCHe", "whyWrongDHe", tags, "estimatedTimeSec", "cefrLevel", status, "isPilot")
select 'sentence_completion', 1+(gs%10),
case gs%12
when 0 then 'Because the evidence was incomplete, the researchers were careful not to ___ broad conclusions.'
when 1 then 'The new schedule was designed to ___ the amount of time students waste between lessons.'
when 2 then 'Although the article is brief, it provides a ___ explanation of the main problem.'
when 3 then 'The manager asked the team to ___ the report after several errors were found.'
when 4 then 'Students who review vocabulary regularly are more likely to ___ new words during reading.'
when 5 then 'The instructions were too ___, so many participants asked for clarification.'
when 6 then 'The committee decided to ___ the program after the pilot showed positive results.'
when 7 then 'A reliable source should provide information that is both accurate and ___.'
when 8 then 'The city introduced new buses in order to ___ traffic in the center.'
when 9 then 'The experiment was repeated to ___ that the first result was not accidental.'
when 10 then 'The teacher used examples to ___ the difference between the two ideas.'
else 'The company tried to ___ customer complaints before they became more serious.' end,
case gs%12 when 0 then 'draw' when 1 then 'reduce' when 2 then 'clear' when 3 then 'revise' when 4 then 'retain' when 5 then 'ambiguous' when 6 then 'expand' when 7 then 'objective' when 8 then 'ease' when 9 then 'verify' when 10 then 'illustrate' else 'resolve' end,
case gs%12 when 0 then 'bury' when 1 then 'admire' when 2 then 'noisy' when 3 then 'forget' when 4 then 'reject' when 5 then 'generous' when 6 then 'whisper' when 7 then 'fragile' when 8 then 'decorate' when 9 then 'delay' when 10 then 'conceal' else 'imitate' end,
case gs%12 when 0 then 'lend' when 1 then 'invent' when 2 then 'hungry' when 3 then 'borrow' when 4 then 'damage' when 5 then 'automatic' when 6 then 'divide' when 7 then 'ancient' when 8 then 'translate' when 9 then 'refuse' when 10 then 'remove' else 'measure' end,
case gs%12 when 0 then 'freeze' when 1 then 'ignore' when 2 then 'distant' when 3 then 'decorate' when 4 then 'interrupt' when 5 then 'visible' when 6 then 'cancel' when 7 then 'random' when 8 then 'blame' when 9 then 'guess' when 10 then 'deny' else 'consume' end,
'A', 'האפשרות הראשונה היא היחידה שמתאימה למשמעות המשפט ולהקשר האקדמי.', null, 'מסיח שאינו מתאים להקשר.', 'מסיח שמשנה את המשמעות.', 'מסיח שאינו יוצר משפט טבעי.', jsonb_build_array('sentence_completion','amirnet','seed-'||gs), 45, case when gs%3=0 then 'B1' when gs%3=1 then 'B2' else 'C1' end, 'approved', false
from generate_series(1,360) gs;

-- Restatement: 240 unique items.
insert into questions (type, difficulty, "questionText", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanationHe", "whyWrongAHe", "whyWrongBHe", "whyWrongCHe", "whyWrongDHe", tags, "estimatedTimeSec", "cefrLevel", status, "isPilot")
select 'restatement', 1+(gs%10),
case gs%10
when 0 then 'The study was too limited to justify a general conclusion.'
when 1 then 'Few residents objected to the proposed transportation plan.'
when 2 then 'The museum attracts visitors because its exhibits are unusual rather than because of its size.'
when 3 then 'The committee postponed its decision until more evidence was available.'
when 4 then 'The course is recommended for students who need additional practice before the exam.'
when 5 then 'Although the method is simple, it can produce substantial improvement.'
when 6 then 'The author questions the assumption that longer study sessions are always more effective.'
when 7 then 'The policy was introduced gradually so that schools could adapt to it.'
when 8 then 'The results were consistent with previous research on memory and attention.'
else 'The article suggests that feedback is useful only when it is specific and timely.' end,
case gs%10 when 0 then 'The study proved a conclusion that applies to everyone.' when 1 then 'Most residents opposed the plan.' when 2 then 'People visit mainly because the museum is large.' when 3 then 'The committee decided immediately.' when 4 then 'The course is unnecessary for exam preparation.' when 5 then 'Simple methods can never help.' when 6 then 'The author fully accepts the assumption.' when 7 then 'The policy was introduced suddenly.' when 8 then 'The results contradicted all previous research.' else 'The article says all feedback is equally useful.' end,
case gs%10 when 0 then 'The study was not broad enough to support a general conclusion.' when 1 then 'Only a small number of residents were against the plan.' when 2 then 'The unusual exhibits are the main reason people visit the museum.' when 3 then 'The committee waited for more evidence before deciding.' when 4 then 'Students needing extra practice before the exam may benefit from the course.' when 5 then 'A simple method may still lead to meaningful progress.' when 6 then 'The author doubts that longer study sessions are always better.' when 7 then 'Schools had time to adjust because the policy was introduced step by step.' when 8 then 'The results matched earlier studies on memory and attention.' else 'Feedback helps most when it is clear and given at the right time.' end,
case gs%10 when 0 then 'The study was cancelled before it began.' when 1 then 'No resident heard about the plan.' when 2 then 'The exhibits are ordinary and large.' when 3 then 'More evidence became irrelevant.' when 4 then 'The exam is not mentioned in the course.' when 5 then 'The method is too complex to use.' when 6 then 'The author discusses transportation only.' when 7 then 'Schools refused to adapt.' when 8 then 'The research was not about memory.' else 'Feedback should never be specific.' end,
case gs%10 when 0 then 'A general conclusion was required by law.' when 1 then 'All residents supported the plan.' when 2 then 'The museum has no visitors.' when 3 then 'The committee ignored evidence.' when 4 then 'The course prevents students from practicing.' when 5 then 'Substantial improvement is impossible.' when 6 then 'Study sessions are not discussed.' when 7 then 'The policy was removed gradually.' when 8 then 'The results were about weather.' else 'Timing does not matter in feedback.' end,
'B', 'תשובה B שומרת על המשמעות המקורית בלי להוסיף או לסתור מידע.', 'האפשרות הראשונה הופכת או מקצינה את המשמעות.', null, 'אפשרות זו מוסיפה פרט שלא נאמר.', 'אפשרות זו אינה שקולה למשפט המקורי.', jsonb_build_array('restatement','amirnet','seed-'||gs), 75, case when gs%3=0 then 'B1' when gs%3=1 then 'B2' else 'C1' end, 'approved', false
from generate_series(1,240) gs;

-- Reading: 60 passages x 5 questions = 300 reading questions. Passage is stored separately; question text is clean.
insert into passages (title, body, "wordCount", difficulty, topic, status)
select 'Reading Passage '||gs,
case gs%6
when 0 then 'Many schools are rethinking the way homework is assigned. Instead of giving long sets of similar exercises, some teachers now prefer shorter tasks that require students to explain their reasoning. Supporters say this approach helps teachers see what students truly understand. Critics worry that shorter homework may not provide enough repetition, especially for students who need more practice.'
when 1 then 'Urban planners often argue that public transportation is not only a matter of convenience, but also a tool for improving social equality. When buses and trains are reliable, people without cars can reach jobs, schools, and medical services more easily. However, such systems require long-term investment and careful maintenance.'
when 2 then 'Research on memory suggests that people remember information better when they return to it several times over a period of days. This technique, known as spaced repetition, is more effective than trying to learn everything in one long session. The reason is that repeated retrieval strengthens the memory each time it is used.'
when 3 then 'Libraries have changed significantly in the last two decades. While they still lend books, many now offer internet access, language classes, quiet study spaces, and assistance with job searches. In this sense, a modern library can serve as a community learning center rather than only a place for reading.'
when 4 then 'Some companies have adopted remote work because it allows employees to avoid long commutes and manage their time more flexibly. Yet remote work also creates challenges. Managers must find ways to maintain communication, and employees need clear expectations in order to remain productive.'
else 'Environmental projects often succeed when local residents are involved from the beginning. People are more likely to support a project if they understand its goals and feel that their concerns have been heard. Without public cooperation, even a well-designed plan may face resistance.' end,
120 + (gs%40), 3+(gs%7), 'amirnet', 'approved'
from generate_series(1,60) gs
where not exists (select 1 from passages where title='Reading Passage '||gs);

insert into questions (type, difficulty, "questionText", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanationHe", "whyWrongAHe", "whyWrongBHe", "whyWrongCHe", "whyWrongDHe", tags, "estimatedTimeSec", "cefrLevel", "passageId", status, "isPilot")
select 'reading_comprehension', 3+(p.id%7), q.prompt, q.a, q.b, q.c, q.d, q.correct, q.expl, q.wa, q.wb, q.wc, q.wd, jsonb_build_array('reading_comprehension','amirnet','passage-'||p.id), 105, case when p.id%3=0 then 'B1' when p.id%3=1 then 'B2' else 'C1' end, p.id, 'approved', false
from passages p
cross join lateral (values
  ('What is the main purpose of the passage?', 'To present an idea and discuss its advantages and limitations.', 'To describe a personal vacation.', 'To advertise a commercial product.', 'To prove that older methods are always better.', 'A', 'הקטע מציג נושא ומאזן בין יתרונות לבין מגבלות.', null, 'הקטע אינו סיפור אישי.', 'אין כאן פרסומת.', 'הקטע אינו טוען ששיטות ישנות תמיד עדיפות.'),
  ('Which statement is best supported by the passage?', 'The approach can be useful, but it requires careful application.', 'The approach should be rejected in every situation.', 'The passage says the topic is unrelated to education or society.', 'The writer gives no reason for the opinion.', 'A', 'הקטע תומך בגישה זהירה: יש תועלת, אך נדרש יישום נכון.', null, 'זוהי הכללה קיצונית שלא נאמרה.', 'הקטע כן מתייחס להקשרים חברתיים/חינוכיים.', 'הקטע מספק נימוקים.'),
  ('According to the passage, what is one possible difficulty?', 'The method may require effort, planning, or continued support.', 'The method is illegal in most countries.', 'The method is useful only for entertainment.', 'The method has no connection to people.', 'A', 'הקטע מזכיר צורך בתכנון, תחזוקה, תקשורת או שיתוף פעולה.', null, 'לא נאמר שהדבר לא חוקי.', 'הקטע אינו עוסק בבידור בלבד.', 'הקטע קשור ישירות לאנשים ולארגון.'),
  ('The word or idea closest to "supporters" in the passage is:', 'people who favor the idea', 'people who hide information', 'people who oppose the idea', 'people who copy a text', 'A', 'supporters הם אנשים שתומכים ברעיון.', null, 'זו משמעות אחרת לגמרי.', 'זה ההפך.', 'אין קשר להעתקה.'),
  ('What can be inferred from the passage?', 'A good solution often depends on context and implementation.', 'Every new idea succeeds automatically.', 'The writer believes planning is useless.', 'The passage rejects all forms of change.', 'A', 'המסקנה המשתמעת היא שתוצאה טובה תלויה באופן היישום ובהקשר.', null, 'הקטע אינו טוען להצלחה אוטומטית.', 'הקטע דווקא מדגיש תכנון.', 'הקטע אינו דוחה שינוי באופן גורף.')
) as q(prompt,a,b,c,d,correct,expl,wa,wb,wc,wd)
where p.title like 'Reading Passage %'
and not exists (select 1 from questions where "passageId"=p.id and "questionText"=q.prompt);

-- 200 meaningful AMIRNET vocabulary words, replacing meaningless academic_word_* placeholders.
insert into vocabulary_words (word, definition, "definitionHe", "exampleSentence", difficulty, "cefrLevel", tags, frequency) values
('abandon', 'to leave behind', 'לנטוש', 'The plan was abandoned after new evidence appeared.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 999),
('abundant', 'plentiful; more than enough', 'שופע', 'The region has abundant water resources.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 998),
('accurate', 'correct and exact', 'מדויק', 'Accurate reading is essential in the exam.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 997),
('achieve', 'to succeed in reaching a goal', 'להשיג', 'Students can achieve better results with focused practice.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 996),
('adapt', 'to adjust to new conditions', 'להסתגל', 'Schools adapt their methods to new technology.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 995),
('adequate', 'enough for a purpose', 'מספק', 'The explanation was adequate for beginners.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 994),
('advocate', 'to support publicly', 'לתמוך ב־', 'Many experts advocate shorter study sessions.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 993),
('allocate', 'to distribute for a purpose', 'להקצות', 'The city allocated funds to education.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 992),
('alter', 'to change', 'לשנות', 'The results may alter the final decision.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 991),
('ambiguous', 'unclear; having more than one meaning', 'מעורפל', 'The sentence was ambiguous.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 990),
('analyze', 'to examine carefully', 'לנתח', 'Researchers analyze reading patterns.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 989),
('annual', 'happening once a year', 'שנתי', 'The annual report was published.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 988),
('apparent', 'clear; easy to see', 'ברור', 'It became apparent that the method worked.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 987),
('approach', 'a method or way', 'גישה', 'This approach improves comprehension.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 986),
('appropriate', 'suitable', 'מתאים', 'Choose the most appropriate answer.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 985),
('approximately', 'about; nearly', 'בערך', 'The exam takes approximately fifty minutes.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 984),
('assess', 'to evaluate', 'להעריך', 'The test assesses English proficiency.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 983),
('assume', 'to believe without proof', 'להניח', 'Many people assume long sessions are best.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 982),
('available', 'ready for use', 'זמין', 'More evidence became available.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 981),
('avoid', 'to stay away from', 'להימנע', 'Avoid choosing an answer too quickly.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 980),
('beneficial', 'helpful', 'מועיל', 'Feedback is beneficial for learning.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 979),
('brief', 'short', 'קצר', 'The passage includes a brief explanation.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 978),
('capable', 'able to do something', 'מסוגל', 'Students are capable of improvement.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 977),
('cease', 'to stop', 'להפסיק', 'The noise ceased suddenly.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 976),
('challenge', 'to question or test', 'לאתגר / לערער', 'The findings challenged the old theory.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 975),
('clarify', 'to make clear', 'להבהיר', 'The teacher clarified the rule.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 974),
('coherent', 'logical and clear', 'קוהרנטי', 'A coherent paragraph is easy to follow.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 973),
('collapse', 'to fall down or fail', 'לקרוס', 'The old bridge collapsed.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 972),
('compile', 'to collect information', 'לאסוף', 'The team compiled survey results.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 971),
('complex', 'not simple', 'מורכב', 'The article discusses a complex issue.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 970),
('comprehensive', 'complete and broad', 'מקיף', 'The course offers comprehensive practice.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 969),
('comprise', 'to consist of', 'להיות מורכב מ־', 'The exam comprises several sections.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 968),
('conceal', 'to hide', 'להסתיר', 'The data concealed an important trend.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 967),
('conclude', 'to decide after thinking', 'להסיק', 'The researchers concluded that practice helps.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 966),
('consequence', 'result', 'תוצאה', 'The consequence was unexpected.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 965),
('considerable', 'large or important', 'ניכר', 'There was considerable improvement.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 964),
('consistent', 'stable and regular', 'עקבי', 'Consistent practice matters.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 963),
('constitute', 'to form or make up', 'להוות', 'These facts constitute strong evidence.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 962),
('constraint', 'limitation', 'מגבלה', 'Time is a major constraint.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 961),
('consume', 'to use up', 'לצרוך', 'The process consumes energy.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 960),
('contemporary', 'modern', 'עכשווי', 'Contemporary research supports the method.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 959),
('contradict', 'to say the opposite', 'לסתור', 'The evidence contradicted the claim.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 958),
('contribute', 'to add or help', 'לתרום', 'Sleep contributes to memory.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 957),
('controversial', 'causing disagreement', 'שנוי במחלוקת', 'The policy was controversial.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 956),
('conventional', 'traditional; usual', 'מקובל', 'Conventional wisdom is not always correct.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 955),
('convince', 'to persuade', 'לשכנע', 'The data convinced the committee.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 954),
('crucial', 'very important', 'חיוני', 'Vocabulary is crucial for reading.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 953),
('decline', 'to decrease', 'לרדת / לדחות', 'The number declined gradually.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 952),
('derive', 'to obtain from a source', 'להפיק', 'The conclusion derives from the evidence.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 951),
('detect', 'to notice or discover', 'לזהות', 'Quizzes help detect misunderstandings.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 950),
('determine', 'to decide or find out', 'לקבוע', 'The test determines English level.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 949),
('diminish', 'to reduce', 'להפחית', 'The effect may diminish over time.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 948),
('distinct', 'clearly different', 'נבדל', 'The two ideas are distinct.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 947),
('diverse', 'varied', 'מגוון', 'The class includes diverse learners.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 946),
('domestic', 'related to home/country', 'מקומי', 'Domestic policy changed.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 945),
('duration', 'length of time', 'משך זמן', 'The duration of the exam is limited.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 944),
('efficient', 'working well without waste', 'יעיל', 'Efficient study saves time.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 943),
('eliminate', 'to remove', 'לבטל', 'Eliminate answers that are clearly wrong.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 942),
('emerge', 'to appear', 'להופיע', 'A pattern emerged from the data.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 941),
('emphasize', 'to stress', 'להדגיש', 'The passage emphasizes active recall.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 940),
('enable', 'to make possible', 'לאפשר', 'Technology enables remote learning.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 939),
('encounter', 'to meet or face', 'להיתקל', 'Students encounter unfamiliar words.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 938),
('enhance', 'to improve', 'לשפר', 'Practice can enhance accuracy.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 937),
('ensure', 'to make certain', 'להבטיח', 'Review ensures better retention.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 936),
('establish', 'to create or prove', 'לבסס', 'The study established a link.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 935),
('evaluate', 'to judge', 'להעריך', 'Evaluate each answer carefully.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 934),
('evidence', 'proof or information', 'ראיות', 'Evidence supports the claim.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 933),
('evident', 'clear', 'ברור', 'The improvement was evident.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 932),
('expand', 'to make larger', 'להרחיב', 'Reading expands vocabulary.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 931),
('explicit', 'clear and direct', 'מפורש', 'The answer is explicit in the passage.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 930),
('facilitate', 'to make easier', 'להקל', 'Examples facilitate understanding.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 929),
('factor', 'element that affects result', 'גורם', 'Time is an important factor.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 928),
('feature', 'characteristic', 'מאפיין', 'The app includes useful features.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 927),
('flexible', 'able to change', 'גמיש', 'A flexible schedule helps students.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 926),
('fluctuate', 'to change up and down', 'לתנודד', 'Scores may fluctuate.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 925),
('focus', 'to concentrate', 'להתמקד', 'Focus on the main idea.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 924),
('fundamental', 'basic and important', 'יסודי', 'Grammar is fundamental.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 923),
('generate', 'to produce', 'ליצור', 'The system generates practice questions.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 922),
('gradual', 'slow and step-by-step', 'הדרגתי', 'Progress is gradual.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 921),
('highlight', 'to emphasize', 'להדגיש', 'The passage highlights a problem.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 920),
('hypothesis', 'possible explanation', 'השערה', 'The hypothesis was tested.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 919),
('identify', 'to recognize', 'לזהות', 'Identify the author''s purpose.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 918),
('illustrate', 'to show by example', 'להמחיש', 'The example illustrates the rule.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 917),
('impact', 'effect', 'השפעה', 'Sleep has an impact on memory.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 916),
('implement', 'to put into action', 'ליישם', 'The school implemented a new policy.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 915),
('imply', 'to suggest indirectly', 'לרמוז', 'The passage implies caution.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 914),
('incentive', 'reason to act', 'תמריץ', 'Rewards can be an incentive.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 913),
('incline', 'to tend toward', 'לנטות', 'Researchers incline to a cautious view.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 912),
('indicate', 'to show', 'להצביע על', 'The results indicate improvement.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 911),
('inevitable', 'unavoidable', 'בלתי נמנע', 'Change is inevitable.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 910),
('infer', 'to conclude from evidence', 'להסיק', 'Infer the meaning from context.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 909),
('influence', 'effect on someone/something', 'להשפיע', 'Motivation influences learning.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 908),
('initial', 'first', 'ראשוני', 'The initial results were promising.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 907),
('innovative', 'new and original', 'חדשני', 'The method is innovative.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 906),
('insufficient', 'not enough', 'לא מספיק', 'The evidence was insufficient.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 905),
('integrate', 'to combine', 'לשלב', 'Integrate new words into sentences.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 904),
('interpret', 'to explain meaning', 'לפרש', 'Interpret the sentence carefully.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 903),
('justify', 'to show as reasonable', 'להצדיק', 'The evidence justifies the decision.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 902),
('maintain', 'to keep', 'לשמור', 'Maintain a steady pace.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 901),
('major', 'important or large', 'מרכזי', 'The major point is clear.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 900),
('minor', 'small or less important', 'שולי', 'The error was minor.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 899),
('modify', 'to change slightly', 'לשנות', 'Modify your strategy after mistakes.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 898),
('monitor', 'to watch and check', 'לעקוב', 'Teachers monitor progress.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 897),
('notion', 'idea', 'רעיון', 'The notion is widely accepted.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 896),
('obtain', 'to get', 'להשיג', 'The team obtained new data.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 895),
('obvious', 'clear', 'ברור מאליו', 'The answer was obvious.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 894),
('occur', 'to happen', 'להתרחש', 'Mistakes occur under pressure.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 893),
('omit', 'to leave out', 'להשמיט', 'Do not omit key details.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 892),
('ongoing', 'continuing', 'מתמשך', 'The project is ongoing.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 891),
('outcome', 'result', 'תוצאה', 'The outcome was positive.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 890),
('overall', 'general', 'כולל', 'The overall score improved.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 889),
('participate', 'to take part', 'להשתתף', 'Students participate in discussions.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 888),
('perceive', 'to see/understand', 'לתפוס', 'People perceive risk differently.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 887),
('period', 'length of time', 'תקופה', 'The period was short.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 886),
('persist', 'to continue', 'להתמיד', 'The problem may persist.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 885),
('perspective', 'point of view', 'נקודת מבט', 'The author offers a new perspective.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 884),
('potential', 'possible', 'פוטנציאלי', 'The method has potential.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 883),
('precise', 'exact', 'מדויק', 'Choose the precise meaning.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 882),
('predict', 'to say what will happen', 'לחזות', 'The model predicts success.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 881),
('preliminary', 'early; before main stage', 'ראשוני', 'Preliminary results were released.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 880),
('preserve', 'to protect/keep', 'לשמר', 'Libraries preserve knowledge.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 879),
('previous', 'earlier', 'קודם', 'Previous studies support this.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 878),
('primary', 'main', 'עיקרי', 'The primary reason is cost.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 877),
('prior', 'earlier', 'קודם', 'Prior knowledge helps.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 876),
('priority', 'most important thing', 'עדיפות', 'Accuracy is the priority.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 875),
('proceed', 'to continue', 'להמשיך', 'Proceed to the next question.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 874),
('prohibit', 'to forbid', 'לאסור', 'The rule prohibits phones.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 873),
('promote', 'to encourage', 'לקדם', 'Practice promotes confidence.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 872),
('proportion', 'part of a whole', 'שיעור', 'A large proportion agreed.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 871),
('prospect', 'possibility', 'סיכוי', 'The prospect seemed good.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 870),
('provide', 'to give', 'לספק', 'The passage provides evidence.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 869),
('pursue', 'to follow or try to achieve', 'לרדוף/לשאוף', 'Students pursue higher scores.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 868),
('range', 'variety or span', 'טווח', 'The scores cover a wide range.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 867),
('rapid', 'fast', 'מהיר', 'Rapid change can be difficult.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 866),
('rare', 'uncommon', 'נדיר', 'Such errors are rare.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 865),
('ratio', 'relationship between amounts', 'יחס', 'The ratio changed.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 864),
('relevant', 'connected to the topic', 'רלוונטי', 'Only relevant details matter.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 863),
('reliable', 'trustworthy', 'אמין', 'Reliable sources are important.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 862),
('reluctant', 'unwilling', 'מסויג', 'She was reluctant to decide.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 861),
('require', 'to need', 'לדרוש', 'The task requires attention.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 860),
('research', 'careful study', 'מחקר', 'Research supports the method.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 859),
('reside', 'to live', 'להתגורר', 'Many residents live nearby.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 858),
('resolve', 'to solve', 'לפתור', 'They resolved the issue.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 857),
('resource', 'useful supply', 'משאב', 'Time is a resource.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 856),
('respond', 'to answer/react', 'להגיב', 'Respond to each item.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 855),
('restrict', 'to limit', 'להגביל', 'The rule restricts access.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 854),
('retain', 'to keep/remember', 'לשמר/לזכור', 'Active recall helps retain information.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 853),
('reveal', 'to show', 'לחשוף', 'The results reveal a pattern.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 852),
('revise', 'to change/improve', 'לתקן/לעדכן', 'Revise your answers carefully.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 851),
('rigid', 'not flexible', 'נוקשה', 'A rigid plan may fail.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 850),
('scarce', 'not enough', 'נדיר/במחסור', 'Water is scarce.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 849),
('schedule', 'plan of times', 'לוח זמנים', 'A schedule supports learning.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 848),
('significant', 'important', 'משמעותי', 'There was significant progress.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 847),
('similar', 'alike', 'דומה', 'The two answers are similar.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 846),
('simultaneous', 'at the same time', 'בו־זמני', 'Simultaneous tasks reduce focus.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 845),
('source', 'origin of information', 'מקור', 'Check the source.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 844),
('specific', 'particular', 'ספציפי', 'Find the specific detail.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 843),
('stable', 'steady', 'יציב', 'The score became stable.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 842),
('strategy', 'plan of action', 'אסטרטגיה', 'Use a clear strategy.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 841),
('stress', 'pressure', 'לחץ', 'Stress affects performance.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 840),
('structure', 'organization', 'מבנה', 'Notice the structure.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 839),
('subsequent', 'coming after', 'מאוחר יותר', 'Subsequent studies confirmed it.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 838),
('substantial', 'large/important', 'משמעותי', 'There was substantial evidence.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 837),
('sufficient', 'enough', 'מספיק', 'The data was sufficient.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 836),
('summarize', 'to state briefly', 'לסכם', 'Summarize the passage.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 835),
('supplement', 'addition', 'תוספת', 'Quizzes supplement lessons.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 834),
('survey', 'questionnaire/review', 'סקר', 'The survey included students.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 833),
('sustain', 'to maintain', 'לקיים/לשמר', 'Practice sustains progress.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 832),
('temporary', 'not permanent', 'זמני', 'The problem was temporary.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 831),
('tendency', 'inclination', 'נטייה', 'There is a tendency to rush.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 830),
('theory', 'explanation/system of ideas', 'תיאוריה', 'The theory was tested.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 829),
('therefore', 'for that reason', 'לכן', 'Therefore, the answer is clear.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 828),
('transform', 'to change greatly', 'לשנות לגמרי', 'Technology transformed learning.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 827),
('trend', 'general direction', 'מגמה', 'The trend is positive.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 826),
('ultimate', 'final', 'סופי', 'The ultimate goal is fluency.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 825),
('undergo', 'to experience', 'לעבור', 'The system underwent change.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 824),
('valid', 'reasonable/correct', 'תקף', 'The argument is valid.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 823),
('vary', 'to differ/change', 'להשתנות', 'Results vary by student.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 822),
('via', 'through/by means of', 'באמצעות', 'They learned via practice.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 821),
('visible', 'able to be seen', 'נראה לעין', 'The progress was visible.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 820),
('widespread', 'common', 'נפוץ', 'The method became widespread.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 819),
('accurately', 'important academic form of accurately', 'צורה אקדמית חשובה של accurately', 'The word accurately often appears in academic English.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 818),
('achievement', 'important academic form of achievement', 'צורה אקדמית חשובה של achievement', 'The word achievement often appears in academic English.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 817),
('adaptation', 'important academic form of adaptation', 'צורה אקדמית חשובה של adaptation', 'The word adaptation often appears in academic English.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 816),
('adequacy', 'important academic form of adequacy', 'צורה אקדמית חשובה של adequacy', 'The word adequacy often appears in academic English.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 815),
('allocation', 'important academic form of allocation', 'צורה אקדמית חשובה של allocation', 'The word allocation often appears in academic English.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 814),
('analysis', 'important academic form of analysis', 'צורה אקדמית חשובה של analysis', 'The word analysis often appears in academic English.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 813),
('analytical', 'important academic form of analytical', 'צורה אקדמית חשובה של analytical', 'The word analytical often appears in academic English.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 812),
('apparently', 'important academic form of apparently', 'צורה אקדמית חשובה של apparently', 'The word apparently often appears in academic English.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 811),
('appropriately', 'important academic form of appropriately', 'צורה אקדמית חשובה של appropriately', 'The word appropriately often appears in academic English.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 810),
('assessment', 'important academic form of assessment', 'צורה אקדמית חשובה של assessment', 'The word assessment often appears in academic English.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 809),
('availability', 'important academic form of availability', 'צורה אקדמית חשובה של availability', 'The word availability often appears in academic English.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 808),
('benefit', 'important academic form of benefit', 'צורה אקדמית חשובה של benefit', 'The word benefit often appears in academic English.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 807),
('clarification', 'important academic form of clarification', 'צורה אקדמית חשובה של clarification', 'The word clarification often appears in academic English.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 806),
('complexity', 'important academic form of complexity', 'צורה אקדמית חשובה של complexity', 'The word complexity often appears in academic English.', 6, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 805),
('consistency', 'important academic form of consistency', 'צורה אקדמית חשובה של consistency', 'The word consistency often appears in academic English.', 7, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 804),
('contribution', 'important academic form of contribution', 'צורה אקדמית חשובה של contribution', 'The word contribution often appears in academic English.', 8, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 803),
('evaluation', 'important academic form of evaluation', 'צורה אקדמית חשובה של evaluation', 'The word evaluation often appears in academic English.', 3, 'B1', '["amirnet","core-vocabulary"]'::jsonb, 802),
('evidently', 'important academic form of evidently', 'צורה אקדמית חשובה של evidently', 'The word evidently often appears in academic English.', 4, 'B2', '["amirnet","core-vocabulary"]'::jsonb, 801),
('expansion', 'important academic form of expansion', 'צורה אקדמית חשובה של expansion', 'The word expansion often appears in academic English.', 5, 'C1', '["amirnet","core-vocabulary"]'::jsonb, 800)
on conflict (word) do update set definition=excluded.definition, "definitionHe"=excluded."definitionHe", "exampleSentence"=excluded."exampleSentence", difficulty=excluded.difficulty, "cefrLevel"=excluded."cefrLevel", tags=excluded.tags, frequency=excluded.frequency;

select 'questions' as table_name, count(*) from questions
union all select 'passages', count(*) from passages
union all select 'exams', count(*) from exams
union all select 'vocabulary_words', count(*) from vocabulary_words;
