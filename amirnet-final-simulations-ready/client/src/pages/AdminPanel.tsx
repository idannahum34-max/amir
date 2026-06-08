import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Users, BookOpen, BarChart3, CheckCircle, XCircle, AlertTriangle,
  Plus, TrendingUp, DollarSign, Shield
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const typeLabels: Record<string, string> = {
  vocabulary: "אוצר מילים",
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

const emptyQuestion = {
  type: "vocabulary" as const,
  difficulty: 5,
  questionText: "",
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctAnswer: "A" as const,
  explanationHe: "",
  cefrLevel: "",
  status: "draft" as const,
};

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: users } = trpc.admin.users.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: questions, refetch: refetchQuestions } = trpc.admin.questions.useQuery(
    { status: "draft", limit: 50 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: reports } = trpc.admin.reports.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const approveQ = trpc.admin.approveQuestion.useMutation({ onSuccess: () => { toast.success("שאלה אושרה"); refetchQuestions(); } });
  const rejectQ = trpc.admin.rejectQuestion.useMutation({ onSuccess: () => { toast.success("שאלה נדחתה"); refetchQuestions(); } });
  const upsertQ = trpc.admin.upsertQuestion.useMutation({
    onSuccess: () => {
      toast.success(editingId ? "שאלה עודכנה" : "שאלה נוספה");
      setQuestionForm(emptyQuestion);
      setEditingId(null);
      refetchQuestions();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">גישה מוגבלת</h1>
          <p className="text-muted-foreground">רק מנהלים יכולים לגשת לפאנל הניהול</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>חזרה לדשבורד</Button>
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: "משתמשים רשומים", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "שאלות מאושרות", value: stats?.approvedQuestions ?? 0, icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
    { label: "שאלות ממתינות", value: stats?.pendingQuestions ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "בחינות שנגשו", value: stats?.totalAttempts ?? 0, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const handleSubmitQuestion = () => {
    if (!questionForm.questionText || !questionForm.choiceA || !questionForm.choiceB || !questionForm.choiceC || !questionForm.choiceD) {
      toast.error("יש למלא את כל השדות הנדרשים");
      return;
    }
    upsertQ.mutate(editingId ? { ...questionForm, id: editingId } : questionForm);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">פאנל ניהול</h1>
            <p className="text-muted-foreground mt-1">ניהול תוכן, משתמשים ואנליטיקה</p>
          </div>
          <Badge className="bg-primary text-primary-foreground">מנהל</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-2xl font-black text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="questions" dir="rtl">
          <TabsList className="mb-6">
            <TabsTrigger value="questions">שאלות</TabsTrigger>
            <TabsTrigger value="add">הוסף שאלה</TabsTrigger>
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="reports">דיווחים</TabsTrigger>
          </TabsList>

          {/* Questions moderation */}
          <TabsContent value="questions">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">שאלות ממתינות לאישור</CardTitle>
              </CardHeader>
              <CardContent>
                {!questions || questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    אין שאלות ממתינות לאישור
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map(q => (
                      <div key={q.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{typeLabels[q.type] ?? q.type}</Badge>
                              <Badge variant="outline">קושי: {q.difficulty}</Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-2" dir="ltr">{q.questionText}</p>
                            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground" dir="ltr">
                              <span>א) {q.choiceA}</span>
                              <span>ב) {q.choiceB}</span>
                              <span>ג) {q.choiceC}</span>
                              <span>ד) {q.choiceD}</span>
                            </div>
                            <p className="text-xs text-green-600 mt-2">תשובה נכונה: {q.correctAnswer}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveQ.mutate({ id: q.id })}
                              disabled={approveQ.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectQ.mutate({ id: q.id })}
                              disabled={rejectQ.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add question */}
          <TabsContent value="add">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {editingId ? "עריכת שאלה" : "הוספת שאלה חדשה"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>סוג שאלה</Label>
                    <Select value={questionForm.type} onValueChange={v => setQuestionForm(f => ({ ...f, type: v as any }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>רמת קושי (1-10)</Label>
                    <Input
                      type="number" min={1} max={10}
                      value={questionForm.difficulty}
                      onChange={e => setQuestionForm(f => ({ ...f, difficulty: parseInt(e.target.value) || 5 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>טקסט השאלה (באנגלית)</Label>
                  <Textarea
                    value={questionForm.questionText}
                    onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))}
                    className="mt-1" dir="ltr" rows={3}
                    placeholder="Enter the question text in English..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(["A", "B", "C", "D"] as const).map((letter, i) => {
                    const field = `choice${letter}` as keyof typeof questionForm;
                    return (
                      <div key={letter}>
                        <Label>תשובה {letter}</Label>
                        <Input
                          value={questionForm[field] as string}
                          onChange={e => setQuestionForm(f => ({ ...f, [field]: e.target.value }))}
                          className="mt-1" dir="ltr"
                          placeholder={`Choice ${letter}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <Label>תשובה נכונה</Label>
                  <Select value={questionForm.correctAnswer} onValueChange={v => setQuestionForm(f => ({ ...f, correctAnswer: v as any }))}>
                    <SelectTrigger className="mt-1 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>הסבר בעברית (אופציונלי)</Label>
                  <Textarea
                    value={questionForm.explanationHe}
                    onChange={e => setQuestionForm(f => ({ ...f, explanationHe: e.target.value }))}
                    className="mt-1" rows={2}
                    placeholder="הסבר מדוע התשובה הנכונה היא..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>רמת CEFR (אופציונלי)</Label>
                    <Select value={questionForm.cefrLevel || "none"} onValueChange={v => setQuestionForm(f => ({ ...f, cefrLevel: v === "none" ? "" : v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="בחר רמה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא</SelectItem>
                        {["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סטטוס</Label>
                    <Select value={questionForm.status} onValueChange={v => setQuestionForm(f => ({ ...f, status: v as any }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">טיוטה</SelectItem>
                        <SelectItem value="approved">מאושר</SelectItem>
                        <SelectItem value="rejected">נדחה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 font-bold" onClick={handleSubmitQuestion} disabled={upsertQ.isPending}>
                    {upsertQ.isPending ? "שומר..." : editingId ? "עדכן שאלה" : "הוסף שאלה"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={() => { setEditingId(null); setQuestionForm(emptyQuestion); }}>
                      ביטול
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">משתמשים רשומים ({users?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(users ?? []).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground text-sm">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "מנהל" : "משתמש"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">דיווחים על שאלות</CardTitle>
              </CardHeader>
              <CardContent>
                {!reports || reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    אין דיווחים פתוחים
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r: any) => (
                      <div key={r.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 text-sm">שאלה #{r.questionId}</p>
                            <p className="text-amber-700 text-sm mt-1">{r.reason}</p>
                            <p className="text-xs text-amber-600 mt-1">
                              {new Date(r.createdAt).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
