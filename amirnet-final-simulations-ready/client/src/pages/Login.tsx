import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { GraduationCap } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type Mode = "login" | "register";

function getReturnTo() {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo") || "/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const returnTo = useMemo(() => getReturnTo(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const pending = login.isPending || register.isPending;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const user = mode === "register"
        ? await register.mutateAsync({ name, email, password })
        : await login.mutateAsync({ email, password });

      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
      setLocation(returnTo);
    } catch (err: any) {
      setError(err?.message || "משהו השתבש. נסו שוב.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="mx-auto flex items-center justify-center gap-2 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-black text-2xl">אמירנט פרפ</span>
          </Link>
          <div>
            <CardTitle className="text-2xl font-black">
              {mode === "login" ? "התחברות" : "יצירת חשבון"}
            </CardTitle>
            <CardDescription className="mt-2">
              {mode === "login"
                ? "התחברו כדי להמשיך לתרגול ולסימולציות"
                : "פתחו חשבון והתחילו לתרגל מיד"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} dir="ltr" />
              {mode === "register" && <p className="text-xs text-muted-foreground">לפחות 8 תווים.</p>}
            </div>

            {error && <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>}

            <Button type="submit" className="w-full font-bold" disabled={pending}>
              {pending ? "רק רגע..." : mode === "login" ? "התחברות" : "יצירת חשבון"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{" "}
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
              {mode === "login" ? "להרשמה" : "להתחברות"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
