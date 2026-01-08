import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user role from users table
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (userData) {
          // Redirect based on role
          if (userData.role === "manager") {
            navigate("/dashboard");
          } else if (userData.role === "employee") {
            navigate("/employee-dashboard");
          } else if (userData.role === "client") {
            navigate("/client-dashboard");
          }
        }
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "ההתחברות נכשלה",
          description: error.message,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get user data from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role, name, auth_user_id")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

        if (userError) {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "שגיאת מסד נתונים",
            description: `שגיאה בבדיקת הרשאות משתמש: ${userError.message}`,
          });
          setLoading(false);
          return;
        }

        if (!userData) {
          // User authenticated but not in users table
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "החשבון לא מקושר",
            description: "החשבון שלך אינו מקושר לפרופיל משתמש. אנא פנה למנהל.",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "ההתחברות הצליחה",
          description: `ברוך הבא${userData.name ? ', ' + userData.name : ''}!`,
        });

        // Redirect based on role
        if (userData.role === "manager") {
          navigate("/dashboard");
        } else if (userData.role === "employee") {
          navigate("/employee-dashboard");
        } else if (userData.role === "client") {
          navigate("/client-dashboard");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה. נסה שוב.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">לוח עבודה</h1>
          <p className="text-muted-foreground">מערכת ניהול משימות</p>
        </div>
        
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">ברוך הבא</CardTitle>
            <CardDescription>
              הזן את פרטי הכניסה שלך כדי לגשת לחשבון
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  "התחבר"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          למורשים בלבד
        </p>
      </div>
    </div>
  );
};

export default Auth;
