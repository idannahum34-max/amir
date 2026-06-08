import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { hasPremiumAccess } from "@/lib/premium";
import {
  BookOpen, Brain, ChartBar, Clock, GraduationCap, Play, Star,
  TrendingUp, Zap, ArrowLeft, CheckCircle, AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const typeLabels: Record<string, string> = {
  vocabulary: "אוצר מילים",
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

function AccuracyBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-bar-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: myPlan } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const hasSubscription = hasPremiumAccess(user, myPlan);
  const { data: profile } = trpc.exam.weaknessProfile.useQuery(undefined, { enabled: isAuthenticated && hasSubscription });
  const { data: attempts } = trpc.exam.myAttempts.useQuery({ limit: 10 }, { enabled: isAuthenticated && hasSubscription });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black text-foreground mb-4">ברוך הבא לאמירנט פרפ</h1>
          <p className="text-muted-foreground mb-8">התחבר/י כדי לגשת ללוח הבקרה האישי שלך</p>
          <a href={getLoginUrl("/dashboard")}>
            <Button size="lg" className="font-bold">התחבר/י עכשיו</Button>
          </a>
        </div>
      </div>
    );
  }

  const vocabAcc = parseFloat(String(profile?.vocabularyAccuracy ?? "50"));
  const sentAcc = parseFloat(String(profile?.sentenceCompletionAccuracy ?? "50"));
  const restAcc = parseFloat(String(profile?.restatementAccuracy ?? "50"));
  const readAcc = parseFloat(String(profile?.readingComprehensionAccuracy ?? "50"));
  const overallAcc = Math.round((vocabAcc + sentAcc + restAcc + readAcc) / 4);
  const estimatedScore = profile?.estimatedScore ?? 100;

  // Build score trend from attempts
  const scoreTrend = (attempts ?? [])
    .filter(a => a.status === "completed" && a.score !== null)
    .slice().reverse()
    .map((a, i) => ({
      name: `#${i + 1}`,
      ציון: a.score,
      אמירנט: a.estimatedAmirnetScore,
    }));

  // Radar data
  const radarData = [
    { subject: "אוצר מילים", A: vocabAcc },
    { subject: "השלמת משפטים", A: sentAcc },
    { subject: "ניסוח מחדש", A: restAcc },
    { subject: "הבנת הנקרא", A: readAcc },
  ];

  // Find weakest area
  const areas = [
    { key: "vocabulary", acc: vocabAcc },
    { key: "sentence_completion", acc: sentAcc },
    { key: "restatement", acc: restAcc },
    { key: "reading_comprehension", acc: readAcc },
  ];
  const weakest = areas.sort((a, b) => a.acc - b.acc)[0];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-8">
        {/* Welcome header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground">
              שלום, {user?.name?.split(" ")[0] ?? "סטודנט"} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile?.totalQuestionsAnswered
                ? `ענית על ${profile.totalQuestionsAnswered} שאלות עד כה`
                : "התחל/י לתרגל כדי לראות את ההתקדמות שלך"}
            </p>
          </div>
          {!hasSubscription && (
            <Link href="/pricing">
              <Button className="font-bold gap-2">
                <Star className="w-4 h-4" />
                שדרג/י לפרימיום
              </Button>
            </Link>
          )}
        </div>

        {/* Subscription banner */}
        {!hasSubscription && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">אתה/את במסלול הניסיון החינמי</p>
                <p className="text-sm text-amber-700">שדרג/י כדי לפתוח גישה מלאה לכל השאלות והסימולציות</p>
              </div>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0">
                שדרג/י עכשיו
              </Button>
            </Link>
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "ציון כולל", value: `${overallAcc}%`, icon: ChartBar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "ציון אמירנט משוער", value: String(estimatedScore), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "שאלות שנענו", value: String(profile?.totalQuestionsAnswered ?? 0), icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "בחינות שנגשת", value: String(attempts?.length ?? 0), icon: GraduationCap, color: "text-pink-600", bg: "bg-pink-50" },
          ].map(m => (
            <Card key={m.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div className="text-2xl font-black text-foreground">{m.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/practice">
                <Button className="w-full justify-between font-semibold" variant="outline">
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />תרגול שאלות</span>
                  <ArrowLeft className="w-4 h-4 rtl-flip" />
                </Button>
              </Link>
              <Link href="/exam">
                <Button className="w-full justify-between font-semibold">
                  <span className="flex items-center gap-2"><Play className="w-4 h-4" />התחל סימולציה</span>
                  <ArrowLeft className="w-4 h-4 rtl-flip" />
                </Button>
              </Link>
              <Link href="/vocabulary">
                <Button className="w-full justify-between font-semibold" variant="outline">
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4" />אוצר מילים</span>
                  <ArrowLeft className="w-4 h-4 rtl-flip" />
                </Button>
              </Link>
              {weakest && (
                <Link href={`/practice?type=${weakest.key}`}>
                  <Button className="w-full justify-between font-semibold border-red-200 text-red-700 hover:bg-red-50" variant="outline">
                    <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />תרגל נקודת חולשה</span>
                    <ArrowLeft className="w-4 h-4 rtl-flip" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Accuracy by type */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">דיוק לפי סוג שאלה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AccuracyBar label="אוצר מילים" value={vocabAcc} />
              <AccuracyBar label="השלמת משפטים" value={sentAcc} />
              <AccuracyBar label="ניסוח מחדש" value={restAcc} />
              <AccuracyBar label="הבנת הנקרא" value={readAcc} />
            </CardContent>
          </Card>

          {/* Radar chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">מפת כישורים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Radar name="דיוק" dataKey="A" stroke="#3b5bdb" fill="#3b5bdb" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Score trend */}
        {scoreTrend.length > 1 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">מגמת ציונים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ציון" stroke="#3b5bdb" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent attempts */}
        {attempts && attempts.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">בחינות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.slice(0, 5).map(a => {
                  const score = a.score ?? 0;
                  const modeLabel = a.mode === "simulation" ? "סימולציה" : a.mode === "adaptive" ? "מותאם" : "תרגול";
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${score >= 75 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {score}%
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{modeLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.correctAnswers ?? 0}/{a.totalQuestions ?? 0} נכון
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.estimatedAmirnetScore && (
                          <Badge variant="secondary" className="text-xs">
                            אמירנט: {a.estimatedAmirnetScore}
                          </Badge>
                        )}
                        <Link href={`/exam/result/${a.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">פרטים</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
