import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { hasPremiumAccess } from "@/lib/premium";
import { GraduationCap, Menu, X, Crown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navLinks = [
  { href: "/dashboard", label: "לוח בקרה" },
  { href: "/practice", label: "תרגול שאלות" },
  { href: "/exam", label: "סימולציות" },
  { href: "/vocabulary", label: "אוצר מילים" },
  { href: "/pricing", label: "מחירים" },
];

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: myPlan } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });
  const premiumActive = hasPremiumAccess(user, myPlan);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-black text-xl text-foreground tracking-tight">אמירנט פרפ</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
                {link.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {premiumActive ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Crown className="w-3.5 h-3.5" /> פרימיום פעיל
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => logout()}>יציאה</Button>
            </div>
          ) : (
            <>
              <a href={getLoginUrl("/dashboard")}>
                <Button variant="ghost" size="sm">התחברות</Button>
              </a>
              <a href={getLoginUrl("/dashboard")}>
                <Button size="sm" className="font-semibold">התחל חינם</Button>
              </a>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted/50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button
                className="w-full text-right px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </button>
            </Link>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            {isAuthenticated ? (
              <Button variant="ghost" className="w-full" onClick={() => logout()}>יציאה</Button>
            ) : (
              <a href={getLoginUrl("/dashboard")}>
                <Button className="w-full font-semibold">התחל חינם</Button>
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
