import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { User, CreditCard, Calendar, Shield } from "lucide-react";
import { Link } from "wouter";
import NavBar from "@/components/NavBar";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: myPlan } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <NavBar />
        <div className="container py-24 text-center">
          <p className="text-muted-foreground">יש להתחבר כדי לצפות בפרופיל</p>
        </div>
      </div>
    );
  }

  const sub = myPlan?.subscription;
  const plan = myPlan?.plan;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NavBar />
      <div className="container py-8">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-3xl font-black text-foreground">הפרופיל שלי</h1>

          {/* User info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">שם</span>
                <span className="font-medium text-foreground">{user?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">אימייל</span>
                <span className="font-medium text-foreground">{user?.email ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">תפקיד</span>
                <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                  {user?.role === "admin" ? "מנהל" : "משתמש"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                מנוי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">מסלול</span>
                    <Badge className="bg-primary text-primary-foreground">{plan.nameHe}</Badge>
                  </div>
                  {sub?.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">תוקף עד</span>
                      <span className="font-medium text-foreground">
                        {new Date(sub.expiresAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">סטטוס</span>
                    <Badge variant={sub?.status === "active" ? "default" : "secondary"}>
                      {sub?.status === "active" ? "פעיל" : sub?.status === "trial" ? "ניסיון" : "פג תוקף"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">אין מנוי פעיל</p>
                  <Link href="/pricing">
                    <Button size="sm" className="font-semibold">בחר/י מסלול</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guarantee */}
          <Card className="border-0 shadow-sm bg-green-50 border-green-200">
            <CardContent className="p-5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">אחריות החזר כסף 14 יום</p>
                <p className="text-sm text-green-700 mt-1">
                  לא מרוצה/ה? נחזיר לך את מלוא הסכום תוך 14 יום מהרכישה, ללא שאלות.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => logout()}>
            יציאה מהחשבון
          </Button>
        </div>
      </div>
    </div>
  );
}
