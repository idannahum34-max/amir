import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, ChartBar, CheckCircle, GraduationCap, PlayCircle, Shield, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: Brain, title: "תרגול מותאם אישית", desc: "שאלות לפי נושאים, רמות קושי ונקודות חולשה." },
  { icon: ChartBar, title: "סימולציות מלאות", desc: "תרגול במבנה מבחן עם מעקב התקדמות." },
  { icon: BookOpen, title: "אוצר מילים", desc: "מילים חשובות לאמירנט עם תרגול וחזרות." },
  { icon: Zap, title: "הסברים בעברית", desc: "הבנה מלאה של הטעות ולא רק סימון תשובה." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-xl text-foreground tracking-tight">אמירנט פרפ</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">תכונות</a>
            <a href="#start" className="hover:text-foreground transition-colors">התחלה</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard"><Button size="sm" className="font-semibold">לוח הבקרה</Button></Link>
            ) : (
              <>
                <a href="/demo"><Button variant="ghost" size="sm">דמו חינם</Button></a>
                <a href="/pricing"><Button size="sm" className="font-semibold">14 יום ניסיון</Button></a>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-background to-blue-50/40">
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 text-sm font-medium px-4 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
              הכנה חכמה לאמירנט
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
              הדרך החכמה להתכונן לאמירנט
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light mb-4">
              דמו חינמי ללא כרטיס אשראי, או 14 יום ניסיון מלא ואז ₪99 לחודש.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <a href="/demo"><Button size="lg" variant="outline" className="text-lg font-bold px-10 py-6">נסה דמו חינם</Button></a>
              <a href="/pricing"><Button size="lg" className="text-lg font-bold px-10 py-6 shadow-lg">התחל 14 יום ניסיון</Button></a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">ללא התחייבות · ביטול בכל זמן · חיוב רק אחרי תקופת הניסיון</p>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">כל מה שצריך לתרגול רציני</h2>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">סימולציות, השלמת משפטים, ניסוח מחדש, קריאה, אוצר מילים והסברים — במקום אחד.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4"><f.icon className="w-6 h-6 text-primary" /></div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="py-24 bg-gradient-to-b from-background to-blue-50/40">
        <div className="container">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <Badge className="mb-5 bg-blue-50 text-primary border-blue-100 px-4 py-1.5 text-sm font-bold">שתי דרכים להתחיל</Badge>
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-4">דמו חינמי או ניסיון מלא</h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">בלי טבלאות מסובכות ובלי מסלולים מבלבלים.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border border-blue-100 bg-white/90 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8 md:p-10 text-center h-full flex flex-col">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6"><PlayCircle className="w-10 h-10 text-primary" /></div>
                <h3 className="text-3xl font-black text-foreground mb-3">דמו חינמי</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">50 שאלות: 20 השלמת משפטים, 20 ניסוח מחדש ושני קטעי קריאה. ללא כרטיס אשראי.</p>
                <ul className="space-y-4 mb-10 text-base flex-1">
                  {["כניסה מיידית", "השלמת משפטים, ניסוח מחדש וקריאה", "תוצאה בסיום"].map(f => <li key={f} className="flex items-center justify-center gap-3 text-muted-foreground"><CheckCircle className="w-5 h-5 text-primary" />{f}</li>)}
                </ul>
                <a href="/demo"><Button size="lg" variant="outline" className="w-full text-lg font-bold py-6">נסה דמו חינם</Button></a>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30 bg-white shadow-2xl rounded-[2rem] overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-2 bg-primary" />
              <CardContent className="p-8 md:p-12 text-center pt-12">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-6"><Sparkles className="w-12 h-12 text-primary" /></div>
                <h3 className="text-3xl md:text-4xl font-black text-foreground mb-3">14 יום ניסיון חינם</h3>
                <p className="text-primary text-lg font-bold mb-6">אחר כך ₪99 לחודש · ביטול בכל עת</p>
                <div className="mb-8 rounded-3xl bg-muted/40 border border-border p-6 max-w-md mx-auto">
                  <span className="text-7xl font-black text-foreground leading-none">₪99</span><span className="text-xl text-muted-foreground font-semibold mr-2">/ חודש</span>
                </div>
                <a href="/pricing"><Button size="lg" className="w-full max-w-md text-lg font-black py-7 shadow-xl">התחל/י ניסיון מלא</Button></a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><span className="font-black text-lg text-foreground">אמירנט פרפ</span></div>
          <p className="text-sm text-muted-foreground">© 2025 אמירנט פרפ. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
