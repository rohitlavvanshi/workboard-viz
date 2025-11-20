import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkClientAccess(session.user.id);
          }, 0);
        } else {
          setIsClient(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkClientAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkClientAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("auth_user_id", userId)
        .maybeSingle();

      setIsClient(!!data && !error);
    } catch (error) {
      setIsClient(false);
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

  if (!user || !session || !isClient) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ClientProtectedRoute;
