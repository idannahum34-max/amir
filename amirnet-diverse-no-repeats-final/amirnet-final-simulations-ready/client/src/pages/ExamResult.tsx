import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, TrendingUp, RotateCcw, Home, CheckCircle, XCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import NavBar from "@/components/NavBar";
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#3b5bdb", "#e5e7eb"];

export default function ExamResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.exam.attemptDetail.useQuery({ attemptId: parseInt(attemptId) });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-16 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">טוען תוצאות...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">תוצאות לא נמצאו</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">חזרה לדשבורד</Button>
        </div>
      </div>
    );
  }

  const { attempt, answers } = data;
  const score = attempt.score ?? 0;
  const estimated = attempt.estimatedAmirnetScore ?? 100;
  const correct = attempt.correctAnswers ?? 0;
  const total = attempt.totalQuestions ?? 0;

  const pieData = [
    { name: "נכון", value: correct },
    { name: "שגוי", value: total - correct },
  ];

  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  const scoreLabel = score >= 80 ? "מצוין!" : score >= 60 ? "טוב" : "יש מקום לשיפור";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2">תוצאות הבחינה</h1>
            <p className="text-muted-foreground">{scoreLabel}</p>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-sm text-center">
              <CardContent className="p-5">
                <div className={`text-4xl font-black ${scoreColor} mb-1`}>{score}%</div>
                <p className="text-sm text-muted-foreground">ציון כולל</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm text-center">
              <CardContent className="p-5">
                <div className="text-4xl font-black text-primary mb-1">{estimated}</div>
                <p className="text-sm text-muted-foreground">ציון אמירנט משוער</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm text-center">
              <CardContent className="p-5">
                <div className="text-4xl font-black text-foreground mb-1">{correct}/{total}</div>
                <p className="text-sm text-muted-foreground">תשובות נכונות</p>
              </CardContent>
            </Card>
          </div>

          {/* Pie chart */}
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">פילוח תשובות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-12">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n === "נכון" ? "נכון" : "שגוי"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-foreground font-medium">{correct} תשובות נכונות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    <span className="text-sm text-foreground font-medium">{total - correct} תשובות שגויות</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 font-bold py-5" onClick={() => navigate("/exam")}>
              <RotateCcw className="w-4 h-4 ml-2" />
              בחינה חדשה
            </Button>
            <Button variant="outline" className="flex-1 py-5" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4 ml-2" />
              לוח הבקרה
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
