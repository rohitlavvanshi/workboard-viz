import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface EmployeeProtectedRouteProps {
  children: React.ReactNode;
}

const EmployeeProtectedRoute = ({ children }: EmployeeProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkEmployeeRole(session.user.id);
          }, 0);
        } else {
          setIsEmployee(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkEmployeeRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEmployeeRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("auth_user_id", userId)
        .eq("role", "employee")
        .maybeSingle();

      setIsEmployee(!!data && !error);
    } catch (error) {
      setIsEmployee(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !session || !isEmployee) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default EmployeeProtectedRoute;
