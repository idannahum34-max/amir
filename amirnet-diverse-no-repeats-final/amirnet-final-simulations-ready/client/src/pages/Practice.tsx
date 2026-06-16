import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { hasPremiumAccess } from "@/lib/premium";
import { BookOpen, Brain, ChevronRight, Clock, Lightbulb, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import QuestionDisplay from "@/components/QuestionDisplay";

const typeLabels: Record<string, string> = {
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

const difficultyLabel = (d: number) => {
  if (d <= 3) return { label: "קל", color: "bg-green-100 text-green-700" };
  if (d <= 6) return { label: "בינוני", color: "bg-amber-100 text-amber-700" };
  return { label: "קשה", color: "bg-red-100 text-red-700" };
};

export default function Practice() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<string>("");
  const [loadingHint, setLoadingHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { data: myPlan, isLoading: planLoading } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const hasPremium = hasPremiumAccess(user, myPlan);

  const { data: questions, isLoading, isError, error, refetch } = trpc.questions.list.useQuery({
    type: typeFilter !== "all" ? typeFilter as any : undefined,
    limit: 200,
  }, { enabled: isAuthenticated && hasPremium });

  const getHint = trpc.hints.getHint.useMutation();
  const toggleSave = trpc.questions.toggleSave.useMutation();

  const question = questions?.[currentIdx];

  const handleAnswer = (choice: string) => {
    if (showResult) return;
    setSelectedAnswer(choice);
    setShowResult(true);
    if (question && choice === question.correctAnswer) {
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setScore(s => ({ ...s, total: s.total + 1 }));
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setHintText("");
    if (currentIdx < (questions?.length ?? 0) - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      toast.success(`סיימת! ענית נכון על ${score.correct + (selectedAnswer === question?.correctAnswer ? 1 : 0)} מתוך ${score.total + 1} שאלות`);
      setCurrentIdx(0);
      refetch();
    }
  };

  const handleHint = async () => {
    if (!question) return;
    if (!isAuthenticated) {
      toast.error("יש להתחבר כדי לקבל רמזים");
      return;
    }
    setLoadingHint(true);
    try {
      const result = await getHint.mutateAsync({ questionId: question.id });
      setHintText(String(result.hint ?? ""));
      setShowHint(true);
    } catch {
      toast.error("הרמז לא נטען כרגע. ההסבר יופיע אחרי סימון תשובה.");
    } finally {
      setLoadingHint(false);
    }
  };

  const choiceLabels = ["A", "B", "C", "D"] as const;
  const choices = question ? [question.choiceA, question.choiceB, question.choiceC, question.choiceD] : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black text-foreground mb-4">תרגול שאלות</h1>
          <p className="text-muted-foreground mb-8">יש להתחבר כדי להתחיל לתרגל</p>
          <a href={getLoginUrl("/practice")}>
            <Button size="lg" className="font-bold">התחבר/י עכשיו</Button>
          </a>
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
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-4">תרגול פרימיום נעול</h1>
          <p className="text-muted-foreground mb-8">המבחן לדוגמה פתוח לכולם. כל מאגר השאלות, הסימולציות, הרמזים וההתקדמות נפתחים אחרי הרשמה לפרימיום.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" className="font-bold" onClick={() => navigate("/pricing")}>פתח/י פרימיום</Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/demo")}>מבחן ניסיון חינמי</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">תרגול שאלות</h1>
              <p className="text-muted-foreground mt-1">
                {score.total > 0 ? `${score.correct}/${score.total} נכון (${Math.round(score.correct/score.total*100)}%)` : "בחר/י סוג שאלה והתחל/י"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentIdx(0); setSelectedAnswer(null); setShowResult(false); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="כל הסוגים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל סוגי השאלות</SelectItem>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => { setCurrentIdx(0); setSelectedAnswer(null); setShowResult(false); refetch(); }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">לא ניתן לטעון את מאגר השאלות כרגע</p>
              <p className="text-xs text-muted-foreground mb-4">{error?.message}</p>
              <Button onClick={() => refetch()}>נסה/י שוב</Button>
            </div>
          ) : !question ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">אין שאלות זמינות כרגע</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{typeLabels[question.type] ?? question.type}</Badge>
                      <Badge className={difficultyLabel(question.difficulty).color}>
                        {difficultyLabel(question.difficulty).label}
                      </Badge>
                      {question.cefrLevel && (
                        <Badge variant="outline">{question.cefrLevel}</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      <span dir="ltr">{currentIdx + 1} / {questions?.length ?? 0}</span>
                    </span>
                  </div>

                  <QuestionDisplay text={question.questionText} type={question.type} passage={(question as any).passage} />

                  {/* Choices */}
                  <div className="space-y-3">
                    {choices.map((choice, i) => {
                      const label = choiceLabels[i];
                      const isSelected = selectedAnswer === label;
                      const isCorrect = label === question.correctAnswer;
                      let variant = "outline";
                      let extraClass = "hover:bg-muted/50 cursor-pointer";

                      if (showResult) {
                        if (isCorrect) extraClass = "bg-green-50 border-green-400 text-green-800";
                        else if (isSelected && !isCorrect) extraClass = "bg-red-50 border-red-400 text-red-800";
                        else extraClass = "opacity-60 cursor-default";
                      }

                      return (
                        <button
                          key={label}
                          className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 ${extraClass} ${showResult ? "" : "hover:border-primary/50"}`}
                          onClick={() => handleAnswer(label)}
                          disabled={showResult}
                          dir="ltr"
                          style={{ textAlign: "left" }}
                        >
                          <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${isSelected || (showResult && isCorrect) ? "border-current" : "border-muted-foreground/40"}`}>
                            {showResult && isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                             showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4 text-red-600" /> :
                             label}
                          </span>
                          <span className="flex-1">{choice}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Hint */}
              {!showResult && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                  onClick={handleHint}
                  disabled={loadingHint}
                >
                  <Lightbulb className="w-4 h-4" />
                  {loadingHint ? "טוען רמז..." : "קבל רמז חכם"}
                </Button>
              )}

              {showHint && hintText && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-amber-800 text-sm leading-relaxed">{hintText}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Explanation after answer */}
              {showResult && question.explanationHe && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-blue-800 mb-2">הסבר:</h4>
                    <p className="text-blue-700 text-sm leading-relaxed">{question.explanationHe}</p>
                  </CardContent>
                </Card>
              )}

              {/* Next button */}
              {showResult && (
                <Button className="w-full font-bold py-5" onClick={handleNext}>
                  {currentIdx < (questions?.length ?? 0) - 1 ? (
                    <>שאלה הבאה <ChevronRight className="w-4 h-4 rtl-flip" /></>
                  ) : (
                    "סיים סבב"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
