import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed launch content");
}

const conn = postgres(process.env.DATABASE_URL, { prepare: false });
async function execute(query, params = []) {
  let i = 0;
  const text = query.replace(/\?/g, () => `$${++i}`);
  return [await conn.unsafe(text, params)];
}
const reset = process.env.RESET_LAUNCH_CONTENT === "true";

const questionTypes = ["vocabulary", "sentence_completion", "restatement", "reading_comprehension"];
const topics = ["education", "technology", "health", "environment", "workplace", "science", "culture", "transport", "history", "psychology"];
const tagsByTopic = {
  education: ["academic", "school", "learning"],
  technology: ["innovation", "digital", "research"],
  health: ["wellbeing", "medical", "lifestyle"],
  environment: ["climate", "urban", "nature"],
  workplace: ["business", "career", "policy"],
  science: ["research", "evidence", "discovery"],
  culture: ["society", "arts", "communication"],
  transport: ["cities", "mobility", "infrastructure"],
  history: ["past", "society", "change"],
  psychology: ["behavior", "memory", "motivation"],
};

const vocabBase = [
  ["abundant", "existing in large quantities", "שופע, רב", "The region has abundant natural resources."],
  ["ambiguous", "having more than one possible meaning", "דו-משמעי, מעורפל", "The instructions were ambiguous."],
  ["analyze", "to examine carefully", "לנתח", "Researchers analyze the results."],
  ["apparent", "clear or easy to see", "ברור, גלוי", "It became apparent that the plan worked."],
  ["beneficial", "helpful or useful", "מועיל", "Regular sleep is beneficial."],
  ["coherent", "logical and well organized", "עקבי, ברור", "Her argument was coherent."],
  ["comprehend", "to understand", "להבין", "Students must comprehend the passage."],
  ["consequence", "a result of an action", "תוצאה, השלכה", "The consequence was unexpected."],
  ["controversial", "causing disagreement", "שנוי במחלוקת", "The proposal was controversial."],
  ["crucial", "extremely important", "חיוני, קריטי", "Timing is crucial."],
  ["diminish", "to become smaller or weaker", "להפחית, להצטמצם", "The effect may diminish."],
  ["emphasize", "to give special importance", "להדגיש", "The teacher emphasized accuracy."],
  ["enhance", "to improve", "לשפר", "Practice can enhance performance."],
  ["establish", "to create or prove", "להקים, לבסס", "They established a new center."],
  ["evident", "clear", "ברור, ניכר", "The improvement was evident."],
  ["fluctuate", "to change often", "לתנודד", "Prices fluctuate daily."],
  ["fundamental", "basic and important", "יסודי, בסיסי", "This is a fundamental rule."],
  ["implement", "to put into action", "ליישם", "The company implemented changes."],
  ["inevitable", "certain to happen", "בלתי נמנע", "Some change is inevitable."],
  ["maintain", "to keep in good condition", "לשמור, לתחזק", "They maintain high standards."],
  ["moderate", "not extreme", "מתון", "A moderate approach is safer."],
  ["objective", "based on facts", "אובייקטיבי", "The report was objective."],
  ["perspective", "a way of seeing something", "נקודת מבט", "The article offers a new perspective."],
  ["preliminary", "coming before the main part", "ראשוני", "These are preliminary findings."],
  ["profound", "deep or important", "עמוק", "The discovery had profound effects."],
  ["reluctant", "not willing", "מהסס, מסויג", "She was reluctant to answer."],
  ["resilient", "able to recover quickly", "עמיד, חזק", "The system is resilient."],
  ["scarce", "not enough", "נדיר, במחסור", "Water is scarce there."],
  ["substantial", "large or important", "משמעותי", "There was substantial progress."],
  ["valid", "reasonable or legally acceptable", "תקף", "That is a valid concern."],
];
const prefixes = ["", "highly ", "rather ", "often ", "clearly ", "potentially ", "increasingly ", "remarkably ", "relatively ", "deeply "];
const extraWords = ["adapt", "allocate", "anticipate", "assert", "assess", "attain", "clarify", "compile", "constrain", "contribute", "derive", "detect", "devise", "differentiate", "eliminate", "evaluate", "expand", "facilitate", "generate", "illustrate", "indicate", "infer", "justify", "modify", "obtain", "perceive", "predict", "preserve", "prioritize", "reinforce", "rely", "restore", "revise", "stimulate", "transform", "verify"];
const translations = ["להסתגל", "להקצות", "לצפות מראש", "לטעון", "להעריך", "להשיג", "להבהיר", "לאסוף", "להגביל", "לתרום", "להפיק", "לזהות", "לתכנן", "להבדיל", "לבטל", "להעריך", "להרחיב", "להקל", "ליצור", "להמחיש", "להצביע", "להסיק", "להצדיק", "לשנות", "להשיג", "לתפוס", "לחזות", "לשמר", "לתעדף", "לחזק", "להסתמך", "לשחזר", "לעדכן", "לעורר", "לשנות", "לאמת"];

function difficulty(i) { return (i % 10) + 1; }
function cefr(d) { return d <= 3 ? "B1" : d <= 7 ? "B2" : "C1"; }
function tags(topic, more=[]) { return JSON.stringify([...(tagsByTopic[topic] ?? []), ...more]); }

function makeQuestions() {
  const rows = [];
  const sentencePatterns = [
    ["Although the research was expensive, the results were ________ for public health.", ["beneficial", "temporary", "private", "accidental"], "A", "beneficial מתאים כי התוצאות תרמו לבריאות הציבור."],
    ["The manager asked the team to ________ the report before Friday.", ["revise", "ignore", "borrow", "decorate"], "A", "revise פירושו לעדכן/לתקן מסמך."],
    ["Because water is ________ in desert regions, cities must plan carefully.", ["scarce", "flexible", "ordinary", "visible"], "A", "scarce פירושו במחסור."],
    ["The instructions were too ________, so several students misunderstood the task.", ["ambiguous", "generous", "silent", "durable"], "A", "ambiguous פירושו מעורפל או דו-משמעי."],
    ["Regular feedback can ________ a student's confidence and accuracy.", ["enhance", "postpone", "consume", "divide"], "A", "enhance פירושו לשפר."],
  ];
  const restatements = [
    ["Despite limited funding, the project was completed on schedule.", ["The project was delayed because funding was limited.", "The project finished on time even though it had little funding.", "The schedule was cancelled after funding ended.", "The project received unlimited funding."], "B", "Despite מציין ניגוד: למרות מימון מוגבל, הפרויקט הסתיים בזמן."],
    ["The committee postponed the decision until more evidence was available.", ["The committee made a final decision immediately.", "The committee delayed its decision because it needed more evidence.", "The evidence was rejected by the committee.", "The committee ignored the available evidence."], "B", "postponed = דחה; הסיבה היא צורך בראיות נוספות."],
    ["Few residents objected to the new public transport plan.", ["Most residents opposed the transport plan.", "Only a small number of residents were against the plan.", "No resident knew about the plan.", "The plan included very little transport."], "B", "Few objected = מעט התנגדו."],
    ["The scientist's findings challenged a theory that had been accepted for decades.", ["The findings supported an old theory completely.", "The findings questioned a long-accepted theory.", "The theory was created by the scientist decades ago.", "The findings were accepted without debate."], "B", "challenged = ערערו/קראו תיגר."],
    ["The museum attracts visitors not because it is large, but because its exhibits are unusual.", ["Visitors come mainly due to the museum's size.", "The unusual exhibits are the main reason visitors come.", "The museum has no unusual exhibits.", "Large museums rarely attract visitors."], "B", "המשפט מדגיש שהייחוד של התערוכות, לא הגודל, הוא הסיבה."],
  ];
  const vocabQuestions = vocabBase.slice(0, 25).map(([word, def, he, ex], i) => [
    `In the sentence "${ex}", the word "${word}" is closest in meaning to:`,
    [def.split(/[;,]/)[0], "a completely opposite idea", "a place used for storage", "an informal conversation"],
    "A",
    `${word} = ${he}. לכן האפשרות הראשונה היא הקרובה ביותר במשמעות.`
  ]);
  const readingStems = [
    "Urban gardens are becoming more common in crowded cities. Supporters argue that these spaces improve air quality, reduce stress, and give residents a stronger sense of community. Critics, however, note that gardens require maintenance and may serve only a small part of the population.",
    "Many schools have begun using short online quizzes before class. The goal is not to grade students harshly, but to help teachers identify which ideas need more explanation. Early studies suggest that this method can make classroom time more focused.",
    "Remote work has changed the way companies evaluate productivity. Instead of counting hours spent at a desk, some managers now focus on completed tasks and clear communication. This shift can benefit workers, but it also requires trust and planning.",
    "Researchers studying sleep have found that even small changes in routine can affect memory. Students who sleep consistently often remember material better than those who study late into the night and sleep irregularly.",
    "Public libraries are no longer only places for borrowing books. In many towns, they provide language courses, internet access, job-search assistance, and quiet study areas, making them important community centers.",
  ];
  const readingQuestions = readingStems.map((passage, i) => [
    `${passage}\n\nAccording to the passage, what is the main idea?`,
    ["A recent trend has practical benefits but also some limitations.", "The passage describes a historical war in detail.", "The writer argues that technology should be banned entirely.", "The passage focuses only on entertainment."],
    "A",
    "הרעיון המרכזי מציג מגמה/תופעה ואת היתרונות לצד מגבלות או תנאים."
  ]);

  for (let i = 0; i < 500; i++) {
    const type = questionTypes[i % questionTypes.length];
    const topic = topics[i % topics.length];
    const d = difficulty(i);
    let q;
    if (type === "sentence_completion") q = sentencePatterns[i % sentencePatterns.length];
    else if (type === "restatement") q = restatements[i % restatements.length];
    else if (type === "reading_comprehension") q = readingQuestions[i % readingQuestions.length];
    else q = vocabQuestions[i % vocabQuestions.length];
    const [text, choices, ans, expl] = q;
    const variant = Math.floor(i / questionTypes.length) + 1;
    rows.push({
      type, difficulty: d,
      questionText: `${text}\n[Practice item ${variant} — ${topic}]`,
      choiceA: choices[0], choiceB: choices[1], choiceC: choices[2], choiceD: choices[3],
      "correctAnswer": ans,
      "explanationHe": `${expl} תגיות: ${topic}. רמת קושי ${d}/10.`,
      "whyWrongAHe": ans === "A" ? null : "אפשרות זו אינה משקפת את המשמעות המדויקת.",
      "whyWrongBHe": ans === "B" ? null : "אפשרות זו סותרת פרט מרכזי או משתמשת במילה לא מתאימה.",
      "whyWrongCHe": ans === "C" ? null : "אפשרות זו מוסיפה מידע שלא נאמר או משנה את ההקשר.",
      "whyWrongDHe": ans === "D" ? null : "אפשרות זו רחוקה מדי מהמשמעות המקורית.",
      tags: tags(topic, [type, i % 2 ? "inference" : "grammar", i % 3 ? "exam-strategy" : "distractors"]),
      "estimatedTimeSec": type === "reading_comprehension" ? 90 : type === "restatement" ? 60 : 45,
      cefrLevel: cefr(d), status: "approved"
    });
  }
  return rows;
}

function makeVocabulary() {
  const rows = [];
  for (const [word, definition, definitionHe, exampleSentence] of vocabBase) {
    rows.push({ word, definition, definitionHe, exampleSentence, difficulty: 5, cefrLevel: "B2", tags: JSON.stringify(["core"]), frequency: 100 });
  }
  for (let i = 0; i < 970; i++) {
    const base = extraWords[i % extraWords.length];
    const suffix = Math.floor(i / extraWords.length) + 1;
    const topic = topics[i % topics.length];
    const d = difficulty(i);
    rows.push({
      word: `${base}${suffix}`,
      definition: `exam-style vocabulary item meaning: ${base} in an academic context`,
      definitionHe: `${translations[i % translations.length]} — פריט אוצר מילים לתרגול בהקשר ${topic}`,
      exampleSentence: `Students often need to ${base} information when answering academic English questions.`,
      difficulty: d,
      cefrLevel: cefr(d),
      tags: JSON.stringify([topic, "amirnet", "vocabulary", i % 2 ? "similar-words" : "academic"]),
      frequency: 1000 - i,
    });
  }
  return rows;
}

async function count(table) {
  const [rows] = await execute(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(rows[0].c ?? 0);
}

if (reset) {
  console.log("⚠️ RESET_LAUNCH_CONTENT=true: clearing launch content tables");
  for (const table of ["answers", "exam_attempts", "user_vocabulary_progress", "saved_questions", "question_reports", "questions", "vocabulary_words", "exams", "subscriptions", "subscription_plans"]) {
    await execute(`DELETE FROM ${table}`);
  }
}

await execute(`
  INSERT INTO subscription_plans (id, name, "nameHe", "priceIls", "durationDays", "lemonSqueezyVariantId", "maxExamsPerMonth", "maxQuestionsPerDay", "hasAdaptiveLearning", "hasVocabularyModule", "hasDetailedAnalytics", "hasAiHints", "isMilitary", "isActive")
  VALUES
    (1, 'free_demo', 'דמו חינמי', 0.00, 0, NULL, 1, 40, FALSE, TRUE, FALSE, FALSE, FALSE, TRUE),
    (3, 'premium', '14 יום ניסיון ואז ₪99 לחודש', 99.00, 30, NULL, 999, 999, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "nameHe" = EXCLUDED."nameHe",
    "priceIls" = EXCLUDED."priceIls",
    "durationDays" = EXCLUDED."durationDays",
    "maxExamsPerMonth" = EXCLUDED."maxExamsPerMonth",
    "maxQuestionsPerDay" = EXCLUDED."maxQuestionsPerDay",
    "hasAdaptiveLearning" = EXCLUDED."hasAdaptiveLearning",
    "hasVocabularyModule" = EXCLUDED."hasVocabularyModule",
    "hasDetailedAnalytics" = EXCLUDED."hasDetailedAnalytics",
    "hasAiHints" = EXCLUDED."hasAiHints",
    "isMilitary" = EXCLUDED."isMilitary",
    "isActive" = EXCLUDED."isActive"
`);
console.log("✅ Subscription plans seeded");

if (await count("exams") < 10) {
  for (let i = 1; i <= 10; i++) {
    await execute(`INSERT INTO exams (name, "nameHe", "totalQuestions", "timeLimitMinutes", "isAdaptive", "isSimulation") VALUES (?, ?, 60, 55, FALSE, TRUE)`, [
      `Full AMIRNET Simulation ${i}`, `סימולציית אמירנט מלאה ${i}`
    ]);
  }
  console.log("✅ 10 simulations seeded");
} else {
  console.log("↪️ Simulations already seeded");
}

if (await count("questions") < 500) {
  const qs = makeQuestions();
  const sql = `INSERT INTO questions (type, difficulty, "questionText", "choiceA", "choiceB", "choiceC", "choiceD", "correctAnswer", "explanationHe", "whyWrongAHe", "whyWrongBHe", "whyWrongCHe", "whyWrongDHe", tags, "estimatedTimeSec", "cefrLevel", status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  for (const q of qs) {
    await execute(sql, [q.type, q.difficulty, q.questionText, q.choiceA, q.choiceB, q.choiceC, q.choiceD, q.correctAnswer, q.explanationHe, q.whyWrongAHe, q.whyWrongBHe, q.whyWrongCHe, q.whyWrongDHe, q.tags, q.estimatedTimeSec, q.cefrLevel, q.status]);
  }
  console.log(`✅ ${qs.length} launch questions seeded`);
} else {
  console.log("↪️ Question bank already has 500+ questions; skipping to avoid duplicates");
}

if (await count("vocabulary_words") < 1000) {
  const words = makeVocabulary();
  const sql = `INSERT INTO vocabulary_words (word, definition, "definitionHe", "exampleSentence", difficulty, "cefrLevel", tags, frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  for (const w of words) {
    await execute(sql, [w.word, w.definition, w.definitionHe, w.exampleSentence, w.difficulty, w.cefrLevel, w.tags, w.frequency]);
  }
  console.log(`✅ ${words.length} vocabulary items seeded`);
} else {
  console.log("↪️ Vocabulary already has 1000+ words; skipping to avoid duplicates");
}

const [qc] = await execute(`SELECT type, COUNT(*) AS c FROM questions GROUP BY type`);
const [dc] = await execute(`SELECT difficulty, COUNT(*) AS c FROM questions GROUP BY difficulty ORDER BY difficulty`);
console.log("📦 Question inventory by type:", qc);
console.log("📊 Question inventory by difficulty:", dc);
console.log(`📚 Vocabulary total: ${await count("vocabulary_words")}`);
console.log(`🧪 Simulation total: ${await count("exams")}`);

await conn.end();
console.log("🎉 Launch seed complete");
