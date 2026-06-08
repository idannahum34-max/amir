import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPremiumAccess } from "@/lib/premium";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function BillingSuccess() {
  const [, navigate] = useLocation();
  const { user, refresh } = useAuth();
  const { data, isLoading, refetch } = trpc.subscription.mySubscription.useQuery(undefined, {
    refetchInterval: query => query.state.data?.subscription?.status === "active" ? false : 3000,
  });
  const isActive = hasPremiumAccess(user, data);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <CardContent className="p-8 text-center space-y-5">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-3xl font-black text-foreground">התשלום התקבל</h1>
          {isLoading ? (
            <p className="text-muted-foreground">בודקים את סטטוס המנוי...</p>
          ) : isActive ? (
            <p className="text-muted-foreground">המנוי שלך פעיל. כל תכונות הפרימיום נפתחו.</p>
          ) : (
            <p className="text-muted-foreground">
              התשלום הצליח, והמנוי יופעל אוטומטית ברגע שה-webhook יתקבל. זה בדרך כלל קורה תוך כמה שניות.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/dashboard")} className="font-bold">המשך ללוח הבקרה</Button>
            {!isActive && (
              <Button variant="outline" onClick={async () => { await refetch(); await refresh(); }} className="font-bold gap-2">
                <RefreshCw className="w-4 h-4" /> בדוק שוב
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
