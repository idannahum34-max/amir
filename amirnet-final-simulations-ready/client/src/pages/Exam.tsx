import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { hasPremiumAccess } from "@/lib/premium";
import { Clock, Brain, Play, CheckCircle, XCircle, Lightbulb, ListChecks } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import QuestionDisplay from "@/components/QuestionDisplay";

type ExamMode = "practice" | "adaptive" | "simulation";

interface ExamQuestion {
  id: number;
  type: string;
  difficulty: number;
  questionText: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctAnswer: string;
  explanationHe: string | null;
}

const modeConfig = {
  practice: { label: "תרגול חופשי", desc: "100 שאלות מתחלפות מכל מאגר הפרימיום", count: 100, timeLimit: 0 },
  adaptive: { label: "תרגול מותאם", desc: "50 שאלות לפי נקודות החולשה שלך", count: 50, timeLimit: 0 },
  simulation: { label: "סימולציה מלאה", desc: "50 שאלות, 39 דקות, לפי סוגי השאלות של אמירנט", count: 50, timeLimit: 39 * 60 },
};

export default function Exam() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<"select" | "exam" | "done">("select");
  const [mode, setMode] = useState<ExamMode>("practice");
  const [selectedSimulationId, setSelectedSimulationId] = useState(1);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean; time: number }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [examStartTime, setExamStartTime] = useState(Date.now());
  const [hintText, setHintText] = useState("");
  const [loadingHint, setLoadingHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = trpc.exam.start.useMutation();
  const submitAnswer = trpc.exam.submitAnswer.useMutation();
  const finishExam = trpc.exam.finish.useMutation();
  const getHint = trpc.hints.getHint.useMutation();
  const { data: myPlan, isLoading: planLoading } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const { data: simulations = [] } = trpc.exam.simulations.useQuery(undefined, { enabled: isAuthenticated });
  const hasPremium = hasPremiumAccess(user, myPlan);

  useEffect(() => {
    if (phase === "exam" && modeConfig[mode].timeLimit > 0) {
      setTimeLeft(modeConfig[mode].timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleFinish();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleStart = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/exam");
      return;
    }
    if (!hasPremium) {
      navigate("/pricing");
      return;
    }
    try {
      const result = await startExam.mutateAsync({ mode, count: modeConfig[mode].count, simulationId: mode === "simulation" ? selectedSimulationId : undefined });
      const loadedQuestions = (result.questions as ExamQuestion[]) ?? [];
      if (!loadedQuestions.length) {
        toast.error("אין שאלות זמינות כרגע. יש להריץ seed למסד הנתונים.");
        return;
      }
      setAttemptId(result.attemptId ?? 0);
      setQuestions(loadedQuestions);
      setCurrentIdx(0);
      setAnswers({});
      setExamStartTime(Date.now());
      setQuestionStartTime(Date.now());
      setPhase("exam");
    } catch (e: any) {
      toast.error(e.message ?? "שגיאה בהתחלת הבחינה");
    }
  };

  const handleAnswer = async (choice: string) => {
    if (showResult || !attemptId) return;
    const q = questions[currentIdx];
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    setSelectedAnswer(choice);

    try {
      const result = await submitAnswer.mutateAsync({
        attemptId,
        questionId: q.id,
        selectedAnswer: choice as any,
        timeTakenSeconds: timeTaken,
        usedHint: !!hintText,
      });
      setAnswers(prev => ({ ...prev, [q.id]: { answer: choice, correct: result.isCorrect, time: timeTaken } }));
      setShowResult(true);
    } catch {
      toast.error("שגיאה בשמירת התשובה");
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setHintText("");
    setQuestionStartTime(Date.now());
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!attemptId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - examStartTime) / 1000);
    try {
      await finishExam.mutateAsync({ attemptId, timeTakenSeconds: timeTaken });
      navigate(`/exam/result/${attemptId}`);
    } catch {
      toast.error("הבחינה הסתיימה. לא נשמרו תוצאות בגלל תקלה זמנית בשמירה.");
      navigate("/dashboard");
    }
  };

  const handleHint = async () => {
    const q = questions[currentIdx];
    setLoadingHint(true);
    try {
      const result = await getHint.mutateAsync({ questionId: q.id });
      setHintText(String(result.hint ?? ""));
    } catch {
      toast.error("הרמז לא נטען כרגע. אפשר להמשיך לפתור — ההסבר יופיע אחרי מענה.");
    } finally {
      setLoadingHint(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-4">סימולציות בחינה</h1>
          <p className="text-muted-foreground mb-8">יש להתחבר כדי לגשת לסימולציות</p>
          <a href={getLoginUrl("/exam")}><Button size="lg" className="font-bold">התחבר/י עכשיו</Button></a>
        </div>
      </div>
    );
  }

  if (planLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center max-w-2xl">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-4">סימולציות פרימיום נעולות</h1>
          <p className="text-muted-foreground mb-8">מבחן הניסיון החינמי נשאר פתוח תמיד. סימולציות מלאות, תרגול מותאם ותוצאות מפורטות נפתחים אוטומטית אחרי תשלום.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" className="font-bold" onClick={() => navigate("/pricing")}>פתח/י פרימיום</Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/demo")}>מבחן ניסיון חינמי</Button>
          </div>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (phase === "select") {
    const simItems = (simulations as any[]).length
      ? (simulations as any[]).slice(0, 50)
      : Array.from({ length: 50 }, (_, i) => ({ id: i + 1, nameHe: `סימולציה ${i + 1}`, totalQuestions: 50, timeLimitMinutes: 39 }));

    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-black text-foreground mb-2">מרכז תרגול פרימיום</h1>
              <p className="text-muted-foreground">בחר/י תרגול מהיר, תרגול מותאם או אחת מ־50 סימולציות מלאות.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {(Object.entries(modeConfig) as [ExamMode, typeof modeConfig.practice][]).map(([key, cfg]) => (
                <Card
                  key={key}
                  className={`cursor-pointer border-2 transition-all ${mode === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  onClick={() => setMode(key)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-foreground text-lg">{cfg.label}</h3>
                      {key === "simulation" ? <ListChecks className="w-5 h-5 text-primary" /> : <Brain className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground min-h-[40px]">{cfg.desc}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="secondary">{cfg.count} שאלות</Badge>
                      {cfg.timeLimit > 0 && <Badge variant="outline">{Math.round(cfg.timeLimit / 60)} דקות</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mode === "simulation" && (
              <Card className="mb-8 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-black">בחר/י סימולציה מלאה</h2>
                      <p className="text-muted-foreground text-sm">50 מבחנים שונים. כל מבחן כולל 20 השלמת משפטים, 20 ניסוח מחדש ו־2 קטעי קריאה עם 10 שאלות.</p>
                    </div>
                    <Badge className="text-sm">39 דקות לכל סימולציה</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
                    {simItems.map((sim: any, idx: number) => {
                      const simId = Number(sim.id ?? idx + 1);
                      return (
                        <button
                          key={simId}
                          type="button"
                          onClick={() => setSelectedSimulationId(simId)}
                          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${selectedSimulationId === simId ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary/50"}`}
                        >
                          {simId}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full py-6 text-lg font-bold"
              onClick={handleStart}
              disabled={startExam.isPending}
            >
              {startExam.isPending ? "טוען..." : (
                <><Play className="w-5 h-5 ml-2" /> {mode === "simulation" ? `התחל/י סימולציה ${selectedSimulationId}` : `התחל/י ${modeConfig[mode].label}`}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Exam screen
  const q = questions[currentIdx];
  if (!q) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-4">אין שאלות זמינות</h1>
          <p className="text-muted-foreground mb-8">יש להריץ את seed למסד הנתונים כדי לפתוח את מודולי הפרימיום.</p>
          <Button onClick={() => navigate("/dashboard")}>חזרה ללוח הבקרה</Button>
        </div>
      </div>
    );
  }
  const progress = ((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100;
  const choiceLabels = ["A", "B", "C", "D"] as const;
  const choices = [q.choiceA, q.choiceB, q.choiceC, q.choiceD];
  const isWarning = timeLeft > 0 && timeLeft < 300;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Exam header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-foreground">{modeConfig[mode].label}</span>
            <span className="text-sm text-muted-foreground" dir="ltr">{currentIdx + 1} / {questions.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft > 0 && (
              <div className={`flex items-center gap-1 font-mono font-bold text-lg ${isWarning ? "timer-warning" : "text-foreground"}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleFinish}>סיים</Button>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{q.type === "vocabulary" ? "אוצר מילים" : q.type === "sentence_completion" ? "השלמת משפטים" : q.type === "restatement" ? "ניסוח מחדש" : "הבנת הנקרא"}</Badge>
              </div>
              <QuestionDisplay text={q.questionText} type={q.type} passage={(q as any).passage} />
              <div className="space-y-3">
                {choices.map((choice, i) => {
                  const label = choiceLabels[i];
                  const isSelected = selectedAnswer === label;
                  const isCorrect = label === q.correctAnswer;
                  let cls = "w-full text-right p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3";
                  if (!showResult) cls += " hover:border-primary/50 hover:bg-muted/30 cursor-pointer border-border";
                  else if (isCorrect) cls += " bg-green-50 border-green-400 text-green-800";
                  else if (isSelected) cls += " bg-red-50 border-red-400 text-red-800";
                  else cls += " opacity-50 border-border cursor-default";

                  return (
                    <button key={label} className={cls} onClick={() => handleAnswer(label)} disabled={showResult || submitAnswer.isPending} dir="ltr" style={{ textAlign: "left" }}>
                      <span className="w-7 h-7 rounded-full border-2 border-current/40 flex items-center justify-center text-sm font-bold shrink-0">
                        {showResult && isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         showResult && isSelected ? <XCircle className="w-4 h-4 text-red-600" /> : label}
                      </span>
                      <span className="flex-1">{choice}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {!showResult && (
            <Button variant="outline" className="w-full gap-2 text-amber-700 border-amber-200 hover:bg-amber-50" onClick={handleHint} disabled={loadingHint}>
              <Lightbulb className="w-4 h-4" />
              {loadingHint ? "טוען רמז..." : "רמז חכם"}
            </Button>
          )}

          {hintText && !showResult && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">{hintText}</p>
              </CardContent>
            </Card>
          )}

          {showResult && q.explanationHe && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-bold text-blue-800 mb-1">הסבר:</h4>
                <p className="text-blue-700 text-sm leading-relaxed">{q.explanationHe}</p>
              </CardContent>
            </Card>
          )}

          {showResult && (
            <Button className="w-full py-5 font-bold" onClick={handleNext}>
              {currentIdx < questions.length - 1 ? "שאלה הבאה" : "סיים וראה תוצאות"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
