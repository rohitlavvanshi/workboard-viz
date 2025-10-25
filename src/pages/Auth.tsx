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
        // Verify manager role from users table
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("auth_user_id", session.user.id)
          .eq("role", "manager")
          .maybeSingle();

        if (userData) {
          navigate("/dashboard");
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
          title: "Login Failed",
          description: error.message,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("Logged in user ID:", data.user.id);
        console.log("Logged in user email:", data.user.email);
        
        // Verify user is a manager from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role, name, auth_user_id")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

        console.log("Users table query result:", userData);
        console.log("Users table query error:", userError);

        if (userError) {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Database Error",
            description: `Error checking user permissions: ${userError.message}`,
          });
          setLoading(false);
          return;
        }

        if (!userData) {
          // User authenticated but not in users table
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Account Not Linked",
            description: "Your account is not linked to a user profile. Please contact an administrator.",
          });
          console.error("Auth user not found in users table. Auth ID:", data.user.id);
          setLoading(false);
          return;
        }

        if (userData.role !== "manager") {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: `Only managers can access this system. Your role: ${userData.role}`,
          });
          console.log("User role is not manager:", userData.role);
          setLoading(false);
          return;
        }

        toast({
          title: "Login Successful",
          description: `Welcome back${userData.name ? ', ' + userData.name : ''}!`,
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">WorkBoard</h1>
          <p className="text-muted-foreground">Manager Dashboard</p>
        </div>
        
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Auth;
