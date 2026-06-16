import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle, Lock, PlayCircle, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const PREMIUM_PLAN_ID = 3;

const premiumFeatures = [
  "כל סימולציות הפרימיום פתוחות",
  "מאגר שאלות מלא ומתעדכן",
  "השלמת משפטים וניסוח מחדש ללא הגבלה",
  "קטעי קריאה נוספים עם שאלות והסברים",
  "אוצר מילים מלא לאמירנט",
  "רמזים חכמים והסברים בעברית אחרי כל שאלה",
  "מעקב התקדמות, שמירת שאלות וניתוח חולשות",
  "תרגול מותאם אישית לפי ביצועים",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const checkout = trpc.subscription.checkout.useMutation();

  const startTrial = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/pricing");
      return;
    }

    try {
      const result = await checkout.mutateAsync({
        planId: PREMIUM_PLAN_ID,
        origin: window.location.origin,
      });

      if (result.redirectUrl) window.location.href = result.redirectUrl;
    } catch (error) {
      console.error(error);
      toast.error("לא הצלחנו לפתוח את התשלום. בדוק/י שהגדרות Lemon Squeezy קיימות ב-Vercel.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-50/50" dir="rtl">
      <div className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <button onClick={() => navigate("/")} className="font-black text-xl text-foreground">
            אמירנט פרפ
          </button>
          <button onClick={() => navigate("/")} className="text-sm text-primary font-medium flex items-center gap-1">
            חזרה לעמוד הבית <ArrowRight className="w-4 h-4 rtl-flip" />
          </button>
        </div>
      </div>

      <main className="container py-14 md:py-20">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Badge className="mb-5 bg-blue-50 text-primary border-blue-100 px-4 py-1.5 text-sm font-bold">
            דמו חינמי או ניסיון מלא
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-5 leading-tight">
            בחר/י איך להתחיל
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            אפשר להתחיל בדמו חינמי ללא כרטיס אשראי, או לפתוח ניסיון מלא ל־14 יום ואז ₪99 לחודש.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
          <Card className="border border-blue-100 bg-white/90 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-10 text-center h-full flex flex-col">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <PlayCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">דמו חינמי</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                50 שאלות חינמיות: 20 השלמת משפטים, 20 ניסוח מחדש ושני קטעי קריאה שונים עם שאלות. ללא כרטיס אשראי.
              </p>
              <ul className="space-y-4 mb-10 text-base flex-1">
                {["כניסה מיידית", "שאלות בסגנון אמירנט", "תוצאה בסיום", "מבחן דמו מלא ורציני"].map(feature => (
                  <li key={feature} className="flex items-center justify-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <a href="/demo">
                <Button size="lg" variant="outline" className="w-full text-lg font-bold py-6 border-primary/25 hover:bg-blue-50">
                  נסה דמו חינם
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 bg-white shadow-2xl rounded-[2rem] overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-2 bg-primary" />
            <div className="absolute top-7 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground border-primary px-5 py-2 text-sm font-black shadow-lg">
                ניסיון מלא
              </Badge>
            </div>
            <CardContent className="p-8 md:p-12 text-center pt-20">
              <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">14 יום ניסיון חינם</h2>
              <p className="text-primary text-lg font-bold mb-6">אחר כך ₪99 לחודש · ביטול בכל עת</p>
              <div className="mb-8 rounded-3xl bg-muted/40 border border-border p-6 max-w-md mx-auto">
                <div className="flex items-end justify-center gap-2">
                  <span className="text-7xl font-black text-foreground leading-none">₪99</span>
                  <span className="text-xl text-muted-foreground font-semibold mb-2">/ חודש</span>
                </div>
                <p className="text-muted-foreground mt-3">חיוב מתחיל רק אחרי 14 ימי ניסיון.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-10 text-right max-w-2xl mx-auto">
                {premiumFeatures.map(feature => (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl bg-blue-50/60 border border-blue-100 p-4">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="w-full max-w-md text-lg font-black py-7 shadow-xl hover:shadow-2xl transition-shadow" onClick={startTrial} disabled={checkout.isPending}>
                {checkout.isPending ? "פותח תשלום..." : "התחל/י 14 יום ניסיון חינם"}
              </Button>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> ללא התחייבות</span>
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> תשלום מאובטח</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
