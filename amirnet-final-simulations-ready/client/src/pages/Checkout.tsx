import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shield, CheckCircle, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

export default function Checkout() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planId = parseInt(params.get("planId") ?? "0");

  const { data: plans } = trpc.subscription.plans.useQuery();
  const activate = trpc.subscription.activate.useMutation();
  const [processing, setProcessing] = useState(false);

  const plan = plans?.find(p => p.id === planId);

  const handlePayment = async () => {
    if (!plan) return;
    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(r => setTimeout(r, 1500));
      await activate.mutateAsync({ planId: plan.id });
      toast.success("המנוי הופעל בהצלחה! ברוך הבא/ה לאמירנט פרפ 🎉");
      navigate("/dashboard");
    } catch (e) {
      toast.error("שגיאה בעיבוד התשלום. נסה שוב.");
    } finally {
      setProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground">מסלול לא נמצא</p>
          <Button onClick={() => navigate("/pricing")} className="mt-4">חזרה למחירים</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground">השלמת רכישה</h1>
          <p className="text-muted-foreground mt-2">תשלום מאובטח ומוצפן</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">סיכום הזמנה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">{plan.nameHe}</span>
                <span className="font-black text-xl text-foreground">₪{Number(plan.priceIls)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">4 חודשי גישה מלאה</p>
            </div>

            <div className="space-y-2 text-sm">
              {[
                "גישה לכל תכונות המסלול",
                "אחריות החזר כסף 14 יום",
                "ביטול בכל עת",
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>סה"כ לתשלום</span>
                <span className="text-primary">₪{Number(plan.priceIls)}</span>
              </div>
            </div>

            {/* Mock payment form */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">
                סביבת הדגמה — לא נדרש כרטיס אשראי אמיתי
              </p>
              <p className="text-xs text-blue-600 mt-1">
                בסביבת ייצור, התשלום מתבצע דרך Lemon Squeezy
              </p>
            </div>

            <Button
              className="w-full font-bold py-6 text-lg"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד תשלום...
                </span>
              ) : (
                `שלם ₪${Number(plan.priceIls)}`
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              תשלום מאובטח ומוצפן בתקן PCI DSS
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          בלחיצה על "שלם" אתה/את מסכים/ה לתנאי השימוש ומדיניות הפרטיות שלנו
        </p>
      </div>
    </div>
  );
}
