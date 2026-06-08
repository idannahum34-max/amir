import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { Brain, CheckCircle, Lock, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type DemoQuestion = {
  id: number;
  type: "sentence_completion" | "restatement" | "reading_comprehension";
  passage?: string;
  questionText: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanationHe: string;
};

const demoQuestions: DemoQuestion[] = [
{
  id: 9001,
  type: "sentence_completion",
  questionText: "The museum extended its opening hours to ___ the growing number of visitors during the summer.",
  choiceA: "accommodate",
  choiceB: "interrupt",
  choiceC: "conceal",
  choiceD: "criticize",
  correctAnswer: "A",
  explanationHe: "הקשר הוא הגדלת שעות פתיחה כדי להתאים למספר מבקרים גדול יותר. accommodate = להתאים/לאפשר."
},
{
  id: 9002,
  type: "sentence_completion",
  questionText: "Because the witness gave ___ accounts of the event, the investigators asked for additional evidence.",
  choiceA: "identical",
  choiceB: "conflicting",
  choiceC: "generous",
  choiceD: "temporary",
  correctAnswer: "B",
  explanationHe: "אם החוקרים ביקשו ראיות נוספות, העדויות כנראה סתרו זו את זו. conflicting = סותרות."
},
{
  id: 9003,
  type: "sentence_completion",
  questionText: "The new policy is intended to ___ unnecessary paperwork and make the registration process faster.",
  choiceA: "reduce",
  choiceB: "decorate",
  choiceC: "imitate",
  choiceD: "postpone",
  correctAnswer: "A",
  explanationHe: "מדיניות שמייעלת תהליך אמורה לצמצם בירוקרטיה. reduce = להפחית."
},
{
  id: 9004,
  type: "sentence_completion",
  questionText: "Although the lecture was complex, the professor's examples made the main ideas remarkably ___.",
  choiceA: "obscure",
  choiceB: "accessible",
  choiceC: "fragile",
  choiceD: "irrelevant",
  correctAnswer: "B",
  explanationHe: "למרות מורכבות ההרצאה, הדוגמאות הפכו את הרעיונות לנגישים וברורים. accessible = נגיש."
},
{
  id: 9005,
  type: "sentence_completion",
  questionText: "The company hired an independent expert to ___ the safety of the new device before releasing it.",
  choiceA: "verify",
  choiceB: "ignore",
  choiceC: "borrow",
  choiceD: "delay",
  correctAnswer: "A",
  explanationHe: "מומחה עצמאי נועד לאמת את בטיחות המכשיר. verify = לאמת."
},
{
  id: 9006,
  type: "sentence_completion",
  questionText: "The article was criticized because it relied on ___ evidence rather than carefully collected data.",
  choiceA: "substantial",
  choiceB: "anecdotal",
  choiceC: "precise",
  choiceD: "verified",
  correctAnswer: "B",
  explanationHe: "הניגוד הוא בין ראיות חלשות לבין נתונים שנאספו בקפידה. anecdotal = אנקדוטלי/לא שיטתי."
},
{
  id: 9007,
  type: "sentence_completion",
  questionText: "When water is scarce, farmers must use irrigation systems that ___ waste.",
  choiceA: "minimize",
  choiceB: "celebrate",
  choiceC: "predict",
  choiceD: "expand",
  correctAnswer: "A",
  explanationHe: "במחסור מים רוצים למזער בזבוז. minimize = למזער."
},
{
  id: 9008,
  type: "sentence_completion",
  questionText: "The mayor's proposal was initially unpopular, but public opinion gradually became more ___.",
  choiceA: "favorable",
  choiceB: "hostile",
  choiceC: "random",
  choiceD: "ancient",
  correctAnswer: "A",
  explanationHe: "אם ההצעה הייתה לא פופולרית בתחילה אך הדעה השתנתה, היא נעשתה חיובית יותר. favorable = אוהד/חיובי."
},
{
  id: 9009,
  type: "sentence_completion",
  questionText: "The instructions were so ___ that several participants completed the task incorrectly.",
  choiceA: "ambiguous",
  choiceB: "helpful",
  choiceC: "accurate",
  choiceD: "routine",
  correctAnswer: "A",
  explanationHe: "אם משתתפים טעו בגלל ההוראות, הן היו לא ברורות. ambiguous = דו־משמעי."
},
{
  id: 9010,
  type: "sentence_completion",
  questionText: "Researchers often repeat experiments in order to ensure that the results are ___.",
  choiceA: "reliable",
  choiceB: "decorative",
  choiceC: "optional",
  choiceD: "silent",
  correctAnswer: "A",
  explanationHe: "חזרה על ניסוי בודקת אמינות. reliable = מהימן."
},
{
  id: 9011,
  type: "sentence_completion",
  questionText: "The committee decided to ___ the decision until all financial reports had been reviewed.",
  choiceA: "defer",
  choiceB: "announce",
  choiceC: "simplify",
  choiceD: "approve",
  correctAnswer: "A",
  explanationHe: "אם מחכים עד לאחר בדיקת הדוחות, דוחים את ההחלטה. defer = לדחות."
},
{
  id: 9012,
  type: "sentence_completion",
  questionText: "A good summary should be brief but still ___ the central argument of the text.",
  choiceA: "capture",
  choiceB: "avoid",
  choiceC: "distort",
  choiceD: "erase",
  correctAnswer: "A",
  explanationHe: "סיכום טוב צריך לתפוס/לבטא את הרעיון המרכזי. capture = ללכוד/לבטא."
},
{
  id: 9013,
  type: "sentence_completion",
  questionText: "The two species look similar, but scientists can ___ them by examining their wing patterns.",
  choiceA: "distinguish",
  choiceB: "combine",
  choiceC: "advertise",
  choiceD: "replace",
  correctAnswer: "A",
  explanationHe: "הבדלה בין מינים נעשית לפי דפוסי כנפיים. distinguish = להבחין."
},
{
  id: 9014,
  type: "sentence_completion",
  questionText: "The editor asked the writer to remove details that were not ___ to the main topic.",
  choiceA: "relevant",
  choiceB: "loyal",
  choiceC: "distant",
  choiceD: "visible",
  correctAnswer: "A",
  explanationHe: "פרטים שאינם קשורים לנושא המרכזי יש להסיר. relevant = רלוונטי."
},
{
  id: 9015,
  type: "sentence_completion",
  questionText: "Because the medicine may cause side effects, doctors prescribe it only when it is ___.",
  choiceA: "necessary",
  choiceB: "popular",
  choiceC: "expensive",
  choiceD: "familiar",
  correctAnswer: "A",
  explanationHe: "בגלל תופעות לוואי נותנים תרופה רק כשצריך. necessary = הכרחי."
},
{
  id: 9016,
  type: "sentence_completion",
  questionText: "The team's success was not the result of luck but of careful planning and ___ effort.",
  choiceA: "consistent",
  choiceB: "accidental",
  choiceC: "temporary",
  choiceD: "minor",
  correctAnswer: "A",
  explanationHe: "הצלחה מתכנון ועבודה מצביעה על מאמץ עקבי. consistent = עקבי."
},
{
  id: 9017,
  type: "sentence_completion",
  questionText: "The report provides a ___ explanation of the problem, but it does not offer a practical solution.",
  choiceA: "thorough",
  choiceB: "careless",
  choiceC: "fictional",
  choiceD: "brief",
  correctAnswer: "A",
  explanationHe: "הדוח מסביר היטב אך אינו מציע פתרון. thorough = יסודי."
},
{
  id: 9018,
  type: "sentence_completion",
  questionText: "Many cities encourage cycling because it is an efficient and environmentally ___ form of transportation.",
  choiceA: "friendly",
  choiceB: "dangerous",
  choiceC: "private",
  choiceD: "traditional",
  correctAnswer: "A",
  explanationHe: "תחבורה באופניים נחשבת ידידותית לסביבה. environmentally friendly = ידידותי לסביבה."
},
{
  id: 9019,
  type: "sentence_completion",
  questionText: "The speaker tried to ___ the audience that the project was worth funding.",
  choiceA: "convince",
  choiceB: "confuse",
  choiceC: "exclude",
  choiceD: "measure",
  correctAnswer: "A",
  explanationHe: "המטרה היא לשכנע שהפרויקט שווה מימון. convince = לשכנע."
},
{
  id: 9020,
  type: "sentence_completion",
  questionText: "The historian warned that a single document is rarely ___ to explain an entire period.",
  choiceA: "sufficient",
  choiceB: "illegal",
  choiceC: "automatic",
  choiceD: "familiar",
  correctAnswer: "A",
  explanationHe: "מסמך יחיד בדרך כלל אינו מספיק להסביר תקופה שלמה. sufficient = מספיק."
},
{
  id: 9021,
  type: "restatement",
  questionText: "Despite its small population, the town has become a major cultural center.",
  choiceA: "The town is culturally important even though few people live there.",
  choiceB: "The town became small because it is culturally important.",
  choiceC: "Only large towns can become cultural centers.",
  choiceD: "The town's population increased after cultural events began.",
  correctAnswer: "A",
  explanationHe: "Despite מציין ניגוד: למרות אוכלוסייה קטנה, העיר חשובה תרבותית."
},
{
  id: 9022,
  type: "restatement",
  questionText: "The discovery was significant because it challenged a theory that had been accepted for decades.",
  choiceA: "The discovery supported a theory accepted for decades.",
  choiceB: "The discovery was important because it questioned a long-accepted theory.",
  choiceC: "The discovery was ignored for several decades.",
  choiceD: "The theory became accepted only after the discovery.",
  correctAnswer: "B",
  explanationHe: "challenged = ערער על. התגלית חשובה כי ערערה על תאוריה מקובלת."
},
{
  id: 9023,
  type: "restatement",
  questionText: "No sooner had the meeting begun than the electricity went out.",
  choiceA: "The electricity failed immediately after the meeting started.",
  choiceB: "The meeting began after the electricity returned.",
  choiceC: "The electricity was turned off before the meeting was planned.",
  choiceD: "The meeting was cancelled because there was no electricity.",
  correctAnswer: "A",
  explanationHe: "No sooner... than מציין פעולה שקרתה מיד אחרי פעולה אחרת."
},
{
  id: 9024,
  type: "restatement",
  questionText: "The book is valuable not because it is old, but because it presents a rare point of view.",
  choiceA: "The book is valuable mainly due to its age.",
  choiceB: "The book is valuable because it offers an uncommon perspective.",
  choiceC: "The book is too old to be useful.",
  choiceD: "The book presents the same view as most other books.",
  correctAnswer: "B",
  explanationHe: "הערך הוא בזווית הראייה הנדירה, לא בגיל הספר."
},
{
  id: 9025,
  type: "restatement",
  questionText: "While the plan may be expensive, it is likely to save money in the long run.",
  choiceA: "The plan is cheap but will cost more later.",
  choiceB: "Although costly now, the plan may reduce future expenses.",
  choiceC: "The plan should be rejected because it is expensive.",
  choiceD: "The plan will save money immediately.",
  correctAnswer: "B",
  explanationHe: "המשפט מציג ניגוד בין עלות עכשיו לחיסכון עתידי."
},
{
  id: 9026,
  type: "restatement",
  questionText: "Few researchers expected the results to be so clear.",
  choiceA: "Most researchers predicted clear results.",
  choiceB: "The results were clearer than many researchers had expected.",
  choiceC: "Researchers refused to examine the results.",
  choiceD: "The results were unclear to most researchers.",
  correctAnswer: "B",
  explanationHe: "Few expected = מעטים ציפו. לכן התוצאות היו ברורות יותר מהמצופה."
},
{
  id: 9027,
  type: "restatement",
  questionText: "The device can operate without batteries, provided that it receives enough sunlight.",
  choiceA: "The device needs batteries when sunlight is strong.",
  choiceB: "The device works without batteries if there is sufficient sunlight.",
  choiceC: "The device cannot operate outdoors.",
  choiceD: "Sunlight prevents the device from working.",
  correctAnswer: "B",
  explanationHe: "provided that = בתנאי ש. המכשיר עובד בלי סוללות אם יש מספיק אור שמש."
},
{
  id: 9028,
  type: "restatement",
  questionText: "The artist's later paintings are less colorful but more emotionally powerful than her early work.",
  choiceA: "Her early paintings were less colorful and less emotional.",
  choiceB: "Her later paintings use fewer colors but create a stronger emotional effect.",
  choiceC: "Her later paintings are colorful but emotionally weak.",
  choiceD: "Her early work is considered more powerful because it is colorful.",
  correctAnswer: "B",
  explanationHe: "ההשוואה: פחות צבעוניות, יותר עוצמה רגשית."
},
{
  id: 9029,
  type: "restatement",
  questionText: "The committee approved the proposal only after several changes had been made.",
  choiceA: "The proposal was approved before any changes were made.",
  choiceB: "Several changes were required before the proposal was accepted.",
  choiceC: "The committee rejected the proposal because of the changes.",
  choiceD: "The proposal was changed after it had already been approved.",
  correctAnswer: "B",
  explanationHe: "only after = רק לאחר. השינויים קדמו לאישור."
},
{
  id: 9030,
  type: "restatement",
  questionText: "The museum is closed on Mondays, except during national holidays.",
  choiceA: "The museum is always closed on national holidays.",
  choiceB: "On most Mondays the museum is closed, but not during national holidays.",
  choiceC: "The museum opens only on Mondays.",
  choiceD: "National holidays are the only days when the museum is closed.",
  correctAnswer: "B",
  explanationHe: "except מציין חריג: בימי שני סגור, חוץ מבחגים לאומיים."
},
{
  id: 9031,
  type: "restatement",
  questionText: "The survey suggests that younger voters are more concerned about climate policy than older voters.",
  choiceA: "Older voters are more concerned about climate policy than younger voters.",
  choiceB: "The survey indicates that concern about climate policy is stronger among younger voters.",
  choiceC: "The survey found no difference between age groups.",
  choiceD: "Younger voters are not interested in policy issues.",
  correctAnswer: "B",
  explanationHe: "המשפט משווה בין קבוצות גיל ומראה דאגה גבוהה יותר אצל צעירים."
},
{
  id: 9032,
  type: "restatement",
  questionText: "The new law was introduced in response to a sharp increase in online fraud.",
  choiceA: "Online fraud increased after the new law was introduced.",
  choiceB: "The new law was created because online fraud had risen sharply.",
  choiceC: "The new law caused online fraud to rise.",
  choiceD: "The new law was unrelated to online fraud.",
  correctAnswer: "B",
  explanationHe: "in response to = בתגובה ל. החוק נוצר עקב העלייה בהונאות."
},
{
  id: 9033,
  type: "restatement",
  questionText: "The lecture was difficult to follow, partly because the speaker used many unfamiliar terms.",
  choiceA: "The speaker made the lecture easier by using familiar terms.",
  choiceB: "One reason the lecture was hard to understand was the speaker's use of unfamiliar terms.",
  choiceC: "The lecture was difficult although the speaker avoided technical language.",
  choiceD: "The unfamiliar terms were explained clearly during the lecture.",
  correctAnswer: "B",
  explanationHe: "partly because מציין סיבה חלקית לקושי בהבנת ההרצאה."
},
{
  id: 9034,
  type: "restatement",
  questionText: "The hotel is within walking distance of the station, making taxis unnecessary for most guests.",
  choiceA: "Most guests need taxis because the station is far away.",
  choiceB: "Because the station is close enough to walk to, most guests do not need taxis.",
  choiceC: "The hotel provides taxis to all guests arriving by train.",
  choiceD: "Guests avoid the station because taxis are unnecessary.",
  correctAnswer: "B",
  explanationHe: "within walking distance = במרחק הליכה. לכן מוניות לא נחוצות לרוב האורחים."
},
{
  id: 9035,
  type: "restatement",
  questionText: "The study did not prove the treatment works, but it did show that further research is justified.",
  choiceA: "The study proved that the treatment is effective.",
  choiceB: "Although the treatment was not proven effective, the study supports continued investigation.",
  choiceC: "The study showed that no more research is needed.",
  choiceD: "The treatment was rejected because the study was unnecessary.",
  correctAnswer: "B",
  explanationHe: "המחקר לא הוכיח יעילות, אך כן הצדיק המשך מחקר."
},
{
  id: 9036,
  type: "restatement",
  questionText: "The company reduced prices in an attempt to regain customers it had lost to competitors.",
  choiceA: "The company raised prices after gaining customers from competitors.",
  choiceB: "The company lowered prices to win back customers who had gone elsewhere.",
  choiceC: "Customers left competitors because the company increased prices.",
  choiceD: "The company lost customers after reducing prices.",
  correctAnswer: "B",
  explanationHe: "regain customers = להשיב לקוחות שאבדו למתחרים."
},
{
  id: 9037,
  type: "restatement",
  questionText: "The river is too polluted for swimming, though efforts are being made to clean it.",
  choiceA: "The river is clean enough for swimming.",
  choiceB: "Swimming is unsafe in the river, but attempts are underway to improve its condition.",
  choiceC: "Efforts to clean the river stopped because people swim there.",
  choiceD: "The river became polluted because it was cleaned.",
  correctAnswer: "B",
  explanationHe: "too polluted for swimming = מזוהם מדי לשחייה; though מציין שיש מאמצי ניקוי."
},
{
  id: 9038,
  type: "restatement",
  questionText: "The author avoids giving direct answers, encouraging readers to form their own conclusions.",
  choiceA: "The author tells readers exactly what to think.",
  choiceB: "By not providing direct answers, the author pushes readers to reach conclusions independently.",
  choiceC: "Readers are discouraged from thinking independently.",
  choiceD: "The author gives conclusions before asking questions.",
  correctAnswer: "B",
  explanationHe: "הימנעות מתשובות ישירות גורמת לקוראים להסיק בעצמם."
},
{
  id: 9039,
  type: "restatement",
  questionText: "The stadium was built to host international events as well as local matches.",
  choiceA: "The stadium was built only for local matches.",
  choiceB: "The stadium was designed for both international events and local games.",
  choiceC: "International events were moved because the stadium was too small.",
  choiceD: "Local matches cannot be held in the stadium.",
  correctAnswer: "B",
  explanationHe: "as well as = וגם. האצטדיון מיועד לשני סוגי אירועים."
},
{
  id: 9040,
  type: "restatement",
  questionText: "The professor emphasized that accuracy is more important than speed when analyzing data.",
  choiceA: "The professor said speed matters more than accuracy.",
  choiceB: "According to the professor, careful and accurate analysis should take priority over quick work.",
  choiceC: "The professor discouraged students from analyzing data.",
  choiceD: "Accuracy and speed were described as equally unimportant.",
  correctAnswer: "B",
  explanationHe: "more important than מציין עדיפות של דיוק על פני מהירות."
},
{
  id: 9041,
  type: "reading_comprehension",
  passage: "In many cities, public libraries have changed dramatically over the past two decades. While they still lend books, they now also provide internet access, language classes, workshops, and quiet workspaces. For people who cannot afford private courses or reliable internet at home, these services can be essential. Some critics argue that libraries should focus only on books, but supporters claim that the modern library's role is to provide access to knowledge in whatever form people need it.",
  questionText: "What is the main idea of the passage?",
  choiceA: "Libraries have stopped lending books.",
  choiceB: "Libraries have expanded their role beyond lending books.",
  choiceC: "Internet access has made libraries unnecessary.",
  choiceD: "Critics and supporters agree about libraries.",
  correctAnswer: "B",
  explanationHe: "הקטע מדגיש שהספריות התרחבו מעבר להשאלת ספרים."
},
{
  id: 9042,
  type: "reading_comprehension",
  passage: "In many cities, public libraries have changed dramatically over the past two decades. While they still lend books, they now also provide internet access, language classes, workshops, and quiet workspaces. For people who cannot afford private courses or reliable internet at home, these services can be essential. Some critics argue that libraries should focus only on books, but supporters claim that the modern library's role is to provide access to knowledge in whatever form people need it.",
  questionText: "According to the passage, which service is now offered by many libraries?",
  choiceA: "Medical treatment",
  choiceB: "Language classes",
  choiceC: "Bank loans",
  choiceD: "Private housing",
  correctAnswer: "B",
  explanationHe: "הקטע מזכיר במפורש language classes."
},
{
  id: 9043,
  type: "reading_comprehension",
  passage: "In many cities, public libraries have changed dramatically over the past two decades. While they still lend books, they now also provide internet access, language classes, workshops, and quiet workspaces. For people who cannot afford private courses or reliable internet at home, these services can be essential. Some critics argue that libraries should focus only on books, but supporters claim that the modern library's role is to provide access to knowledge in whatever form people need it.",
  questionText: "Why can library services be essential for some people?",
  choiceA: "They replace all schools.",
  choiceB: "They provide access to resources people may not have at home.",
  choiceC: "They are more entertaining than books.",
  choiceD: "They are required by law.",
  correctAnswer: "B",
  explanationHe: "השירותים חשובים למי שאין לו אינטרנט או קורסים פרטיים בבית."
},
{
  id: 9044,
  type: "reading_comprehension",
  passage: "In many cities, public libraries have changed dramatically over the past two decades. While they still lend books, they now also provide internet access, language classes, workshops, and quiet workspaces. For people who cannot afford private courses or reliable internet at home, these services can be essential. Some critics argue that libraries should focus only on books, but supporters claim that the modern library's role is to provide access to knowledge in whatever form people need it.",
  questionText: "What do critics argue?",
  choiceA: "Libraries should focus only on books.",
  choiceB: "Libraries should close completely.",
  choiceC: "Libraries should charge higher fees.",
  choiceD: "Libraries should stop offering quiet spaces.",
  correctAnswer: "A",
  explanationHe: "המתנגדים טוענים שספריות צריכות להתמקד רק בספרים."
},
{
  id: 9045,
  type: "reading_comprehension",
  passage: "In many cities, public libraries have changed dramatically over the past two decades. While they still lend books, they now also provide internet access, language classes, workshops, and quiet workspaces. For people who cannot afford private courses or reliable internet at home, these services can be essential. Some critics argue that libraries should focus only on books, but supporters claim that the modern library's role is to provide access to knowledge in whatever form people need it.",
  questionText: "The phrase 'in whatever form people need it' suggests that knowledge can be provided through ___",
  choiceA: "books only",
  choiceB: "different types of services and media",
  choiceC: "private companies only",
  choiceD: "traditional classrooms only",
  correctAnswer: "B",
  explanationHe: "הביטוי מציין שידע יכול להגיע בצורות שונות, לא רק ספרים."
},
{
  id: 9051,
  type: "reading_comprehension",
  passage: "Remote work has become common in many industries, especially after companies discovered that some employees could remain productive outside the office. Supporters say that remote work saves commuting time and allows companies to hire people from different regions. However, managers sometimes worry that workers may feel isolated or that teamwork may suffer when people meet only online. As a result, many organizations have adopted hybrid models, combining several office days with several remote days each week.",
  questionText: "What is the passage mainly about?",
  choiceA: "Why all offices should close",
  choiceB: "The rise of remote work and the move toward hybrid models",
  choiceC: "How managers can prevent online meetings",
  choiceD: "Why commuting has become more expensive",
  correctAnswer: "B",
  explanationHe: "הקטע עוסק בעבודה מרחוק ובמודל ההיברידי שנוצר בעקבות יתרונות וחסרונות."
},
{
  id: 9052,
  type: "reading_comprehension",
  passage: "Remote work has become common in many industries, especially after companies discovered that some employees could remain productive outside the office. Supporters say that remote work saves commuting time and allows companies to hire people from different regions. However, managers sometimes worry that workers may feel isolated or that teamwork may suffer when people meet only online. As a result, many organizations have adopted hybrid models, combining several office days with several remote days each week.",
  questionText: "What is one advantage of remote work mentioned in the passage?",
  choiceA: "It eliminates the need for managers.",
  choiceB: "It saves commuting time.",
  choiceC: "It prevents isolation.",
  choiceD: "It makes teamwork unnecessary.",
  correctAnswer: "B",
  explanationHe: "נאמר שעבודה מרחוק חוסכת זמן נסיעה."
},
{
  id: 9053,
  type: "reading_comprehension",
  passage: "Remote work has become common in many industries, especially after companies discovered that some employees could remain productive outside the office. Supporters say that remote work saves commuting time and allows companies to hire people from different regions. However, managers sometimes worry that workers may feel isolated or that teamwork may suffer when people meet only online. As a result, many organizations have adopted hybrid models, combining several office days with several remote days each week.",
  questionText: "Why do some managers worry about remote work?",
  choiceA: "Employees may become isolated.",
  choiceB: "Employees may arrive too early.",
  choiceC: "Companies may hire too many local workers.",
  choiceD: "Online meetings are always illegal.",
  correctAnswer: "A",
  explanationHe: "הקטע מזכיר חשש מבידוד ופגיעה בעבודת צוות."
},
{
  id: 9054,
  type: "reading_comprehension",
  passage: "Remote work has become common in many industries, especially after companies discovered that some employees could remain productive outside the office. Supporters say that remote work saves commuting time and allows companies to hire people from different regions. However, managers sometimes worry that workers may feel isolated or that teamwork may suffer when people meet only online. As a result, many organizations have adopted hybrid models, combining several office days with several remote days each week.",
  questionText: "What is a hybrid model?",
  choiceA: "A model with only remote work",
  choiceB: "A model with only office work",
  choiceC: "A combination of office days and remote days",
  choiceD: "A system for hiring workers from one city",
  correctAnswer: "C",
  explanationHe: "מודל היברידי משלב ימי משרד וימי עבודה מרחוק."
},
{
  id: 9055,
  type: "reading_comprehension",
  passage: "Remote work has become common in many industries, especially after companies discovered that some employees could remain productive outside the office. Supporters say that remote work saves commuting time and allows companies to hire people from different regions. However, managers sometimes worry that workers may feel isolated or that teamwork may suffer when people meet only online. As a result, many organizations have adopted hybrid models, combining several office days with several remote days each week.",
  questionText: "The word 'However' introduces ___",
  choiceA: "a similar advantage",
  choiceB: "a contrast or concern",
  choiceC: "an example of commuting",
  choiceD: "a final conclusion with no problem",
  correctAnswer: "B",
  explanationHe: "However מציין ניגוד — כאן הוא מציג חששות לגבי עבודה מרחוק."
}
];

const typeLabels: Record<DemoQuestion["type"], string> = {
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

export default function Demo() {
  const questions = useMemo<DemoQuestion[]>(() => demoQuestions, []);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const q = questions[idx];
  const labels = ["A", "B", "C", "D"] as const;
  const choices = q ? [q.choiceA, q.choiceB, q.choiceC, q.choiceD] : [];
  const finished = idx >= questions.length;

  const answer = (label: string) => {
    if (!q || answered) return;
    setSelected(label);
    setAnswered(true);
    if (label === q.correctAnswer) setCorrect(c => c + 1);
  };

  const next = () => {
    setSelected(null);
    setAnswered(false);
    setIdx(i => i + 1);
  };

  const restart = () => {
    setIdx(0);
    setCorrect(0);
    setSelected(null);
    setAnswered(false);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <Badge className="gap-1"><Sparkles className="w-3 h-3" /> דמו חינמי מלא</Badge>
            <h1 className="text-4xl font-black">מבחן דמו מלא לפני ניסיון הפרימיום</h1>
            <p className="text-muted-foreground text-lg">
              50 שאלות לפי סדר: 20 השלמת משפטים, 20 ניסוח מחדש ושני קטעי קריאה שונים עם שאלות. ללא אוצר מילים בתחילת הדמו.
            </p>
          </div>

          {finished ? (
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-8 text-center space-y-5">
                <Brain className="w-14 h-14 text-primary mx-auto" />
                <h2 className="text-3xl font-black">סיימת את הדמו</h2>
                <p className="text-xl">ענית נכון על {correct} מתוך {questions.length}</p>
                <div className="bg-muted rounded-2xl p-5 text-right space-y-2">
                  <p className="font-bold flex gap-2 items-center"><Lock className="w-4 h-4" /> מה נפתח בניסיון המלא?</p>
                  <p className="text-muted-foreground">
                    כל סימולציות הפרימיום, מאגר השאלות המלא, תרגול השלמת משפטים וניסוח מחדש, קטעי קריאה נוספים, אוצר מילים מלא, רמזים חכמים, ניתוח חולשות ומעקב התקדמות.
                  </p>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/pricing"><Button size="lg" className="font-bold">התחל/י 14 יום ניסיון חינם</Button></Link>
                  <Button size="lg" variant="outline" onClick={restart}>נסה שוב</Button>
                </div>
              </CardContent>
            </Card>
          ) : q ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div className="flex gap-2"><Badge>{typeLabels[q.type]}</Badge><Badge variant="outline">שאלה {idx + 1}/{questions.length}</Badge></div>
                  <span className="text-sm text-muted-foreground">דמו פתוח ללא הרשמה</span>
                </div>
                {q.passage && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 text-left leading-relaxed whitespace-pre-line" dir="ltr">
                    {q.passage}
                  </div>
                )}
                <p className="text-lg leading-relaxed font-medium" dir="ltr" style={{ textAlign: "left" }}>{q.questionText}</p>
                <div className="space-y-3">
                  {choices.map((choice, i) => {
                    const label = labels[i];
                    const isCorrect = label === q.correctAnswer;
                    const isSelected = selected === label;
                    let cls = "hover:border-primary/50 hover:bg-muted/50";
                    if (answered && isCorrect) cls = "bg-green-50 border-green-400 text-green-800";
                    else if (answered && isSelected) cls = "bg-red-50 border-red-400 text-red-800";
                    else if (answered) cls = "opacity-60";
                    return (
                      <button key={label} onClick={() => answer(label)} disabled={answered} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${cls}`} dir="ltr">
                        <span className="w-7 h-7 rounded-full border flex items-center justify-center font-bold">
                          {answered && isCorrect ? <CheckCircle className="w-4 h-4" /> : answered && isSelected ? <XCircle className="w-4 h-4" /> : label}
                        </span>
                        <span>{choice}</span>
                      </button>
                    );
                  })}
                </div>
                {answered && q.explanationHe && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800"><b>הסבר:</b> {q.explanationHe}</div>}
                {answered && <Button className="w-full font-bold" onClick={next}>{idx === questions.length - 1 ? "סיים דמו" : "שאלה הבאה"}</Button>}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
