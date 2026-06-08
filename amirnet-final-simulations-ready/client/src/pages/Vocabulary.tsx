import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { hasPremiumAccess } from "@/lib/premium";
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";

const masteryColors = [
  "bg-red-100 text-red-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-yellow-100 text-yellow-700",
  "bg-lime-100 text-lime-700",
  "bg-green-100 text-green-700",
];

const masteryLabels = ["לא מכיר/ה", "מכיר/ה מעט", "מכיר/ה", "טוב", "מצוין", "שולט/ת"];

function WordCard({ word, progress, onMastery }: {
  word: any;
  progress?: any;
  onMastery: (level: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const mastery = progress?.masteryLevel ?? 0;

  const speakWord = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative">
      <Card
        className={`border-0 shadow-md cursor-pointer transition-all duration-300 min-h-64 ${flipped ? "bg-primary text-primary-foreground" : "bg-white"}`}
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-64 text-center">
          {!flipped ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                {word.cefrLevel && <Badge variant="outline">{word.cefrLevel}</Badge>}
                <Badge className={masteryColors[mastery]}>{masteryLabels[mastery]}</Badge>
              </div>
              <h2 className="text-4xl font-black text-foreground mb-3" dir="ltr">{word.word}</h2>
              {word.phonetic && (
                <p className="text-muted-foreground text-sm mb-4" dir="ltr">{word.phonetic}</p>
              )}
              <button
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                onClick={e => { e.stopPropagation(); speakWord(); }}
              >
                <Volume2 className="w-4 h-4" />
                הקשב
              </button>
              <p className="text-xs text-muted-foreground mt-6">לחץ/י לראות תרגום</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-primary-foreground mb-3">{word.definitionHe}</p>
              {word.definitionHe && (
                <p className="text-sm text-primary-foreground/80 mb-4 leading-relaxed">{word.definitionHe}</p>
              )}
              {word.exampleSentence && (
                <p className="text-sm text-primary-foreground/70 italic" dir="ltr">"{word.exampleSentence}"</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Mastery buttons */}
      {flipped && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${masteryColors[level]} hover:opacity-80`}
              onClick={() => onMastery(level)}
            >
              {masteryLabels[level]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Vocabulary() {
  const { isAuthenticated, user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState<"all" | "review">("all");

  const { data: myPlan, isLoading: planLoading } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const hasPremium = hasPremiumAccess(user, myPlan);

  const { data: words, isLoading, isError, error, refetch } = trpc.vocabulary.words.useQuery({ limit: 50 }, { enabled: isAuthenticated && hasPremium });
  const { data: progress } = trpc.vocabulary.myProgress.useQuery(undefined, { enabled: isAuthenticated && hasPremium });
  const updateProgress = trpc.vocabulary.updateProgress.useMutation();

  const progressMap = new Map((progress ?? []).map(p => [p.wordId, p]));

  const displayWords = filter === "review"
    ? (words ?? []).filter(w => {
        const p = progressMap.get(w.id);
        return !p || (p.masteryLevel ?? 0) < 3;
      })
    : (words ?? []);

  const word = displayWords[currentIdx];

  const handleMastery = async (level: number) => {
    if (!isAuthenticated || !word) {
      toast.error("יש להתחבר כדי לשמור התקדמות");
      return;
    }
    try {
      await updateProgress.mutateAsync({ wordId: word.id, masteryLevel: level });
      toast.success(level >= 4 ? "מצוין! מילה שולטת 🎉" : "נשמר!");
      if (currentIdx < displayWords.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        toast.success("סיימת את כל המילים בסבב זה!");
        setCurrentIdx(0);
      }
    } catch {
      toast.error("שגיאה בשמירה");
    }
  };

  const masteredCount = (progress ?? []).filter(p => (p.masteryLevel ?? 0) >= 4).length;
  const totalCount = words?.length ?? 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-4">אוצר מילים</h1>
          <p className="text-muted-foreground mb-8">יש להתחבר כדי לגשת למודול אוצר המילים</p>
          <a href={getLoginUrl("/vocabulary")}><Button size="lg" className="font-bold">התחבר/י עכשיו</Button></a>
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
          <h1 className="text-3xl font-black mb-4">אוצר מילים פרימיום נעול</h1>
          <p className="text-muted-foreground mb-8">המבחן לדוגמה פתוח בחינם. מודול אוצר המילים המלא נפתח אוטומטית אחרי תשלום או בזמן ניסיון פרימיום פעיל.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/pricing"><Button size="lg" className="font-bold">פתח/י פרימיום</Button></a>
            <a href="/demo"><Button size="lg" variant="outline">מבחן ניסיון חינמי</Button></a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-foreground">אוצר מילים</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {masteredCount} / {totalCount} מילים שולטות
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => { setFilter("all"); setCurrentIdx(0); }}
              >
                כולן
              </Button>
              <Button
                variant={filter === "review" ? "default" : "outline"}
                size="sm"
                onClick={() => { setFilter("review"); setCurrentIdx(0); }}
              >
                לחזרה
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>התקדמות כוללת</span>
              <span>{totalCount > 0 ? Math.round(masteredCount / totalCount * 100) : 0}%</span>
            </div>
            <Progress value={totalCount > 0 ? (masteredCount / totalCount) * 100 : 0} className="h-2" />
          </div>

          {isError ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">לא ניתן לטעון את אוצר המילים כרגע</p>
              <p className="text-xs text-muted-foreground mb-4">{error?.message}</p>
              <Button onClick={() => refetch()}>נסה/י שוב</Button>
            </div>
          ) : isLoading ? (
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          ) : !word ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-bold text-foreground">כל המילים נסקרו!</p>
              <p className="text-muted-foreground mt-2">חזרה מצוינת</p>
              <Button className="mt-6" onClick={() => { setCurrentIdx(0); refetch(); }}>
                <RotateCcw className="w-4 h-4 ml-2" />
                התחל מחדש
              </Button>
            </div>
          ) : (
            <>
              {/* Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentIdx + 1} / {displayWords.length}</span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentIdx(i => Math.min(displayWords.length - 1, i + 1))} disabled={currentIdx === displayWords.length - 1}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>

              <WordCard
                word={word}
                progress={progressMap.get(word.id)}
                onMastery={handleMastery}
              />

              <p className="text-center text-xs text-muted-foreground mt-6">
                לחץ/י על הכרטיסייה לראות תרגום, ואז בחר/י את רמת השליטה שלך
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
