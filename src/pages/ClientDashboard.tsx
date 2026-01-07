import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Calendar, 
  User, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ListTodo,
  Package
} from "lucide-react";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        
        // Get user info from users table
        const { data: userData } = await supabase
          .from("users")
          .select("id, name")
          .eq("auth_user_id", session.user.id)
          .eq("role", "client")
          .maybeSingle();
        
        if (userData) {
          // Check if there's a linked client record
          const { data: clientData } = await supabase
            .from("clients")
            .select("id")
            .eq("auth_user_id", session.user.id)
            .maybeSingle();
          
          if (clientData) {
            setClientId(clientData.id);
          }
        }
      }
    };

    getCurrentUser();
  }, []);

  // Fetch client information from users table
  const { data: clientInfo, isLoading: isLoadingClient } = useQuery({
    queryKey: ["clientInfo", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      
      // Get user info from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, phone, category")
        .eq("auth_user_id", currentUserId)
        .eq("role", "client")
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) return null;

      // Try to get additional client info from clients table if exists
      const { data: clientData } = await supabase
        .from("clients")
        .select(`
          id,
          services_provided,
          service_start_date,
          client_type,
          assigned_employee_ids
        `)
        .eq("auth_user_id", currentUserId)
        .maybeSingle();

      // Fetch employee names if assigned_employee_ids exists
      let assignedEmployees = null;
      if (clientData?.assigned_employee_ids && clientData.assigned_employee_ids.length > 0) {
        const { data: employeesData } = await supabase
          .from("users")
          .select("id, name")
          .in("id", clientData.assigned_employee_ids);
        
        assignedEmployees = employeesData;
      }

      // Merge user and client data
      return {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        category: userData.category,
        services_provided: clientData?.services_provided,
        service_start_date: clientData?.service_start_date,
        client_type: clientData?.client_type,
        assigned_employees: assignedEmployees,
      };
    },
    enabled: !!currentUserId,
  });

  // Fetch tasks for this client
  const { data: tasks, isLoading: isLoadingTasks, refetch } = useQuery({
    queryKey: ["clientTasks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:user_id (
            id,
            name
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Real-time subscription for tasks
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('client-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, refetch]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
    navigate("/");
  };

  // Filter tasks by status
  const filteredTasks = tasks?.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <ListTodo className="h-4 w-4" />;
      default:
        return <ListTodo className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "completed":
        return "הושלם";
      case "in_progress":
        return "בביצוע";
      case "pending":
        return "ממתין";
      default:
        return "ממתין";
    }
  };

  const getFrequencyLabel = (frequency: string | null) => {
    switch (frequency) {
      case "one_time":
        return "חד פעמי";
      case "daily":
        return "יומי";
      case "weekly":
        return "שבועי";
      case "monthly":
        return "חודשי";
      case "quarterly":
        return "רבעוני";
      case "semi_annually":
        return "חצי שנתי";
      case "annually":
        return "שנתי";
      default:
        return frequency;
    }
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  ברוך הבא, {clientInfo?.name}
                </h1>
                <p className="text-sm text-muted-foreground">פורטל לקוחות</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 me-2" />
              התנתק
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Client Information Card */}
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                המידע שלך
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientInfo?.services_provided && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">שירותים מסופקים</p>
                    <p className="text-base text-foreground">{clientInfo.services_provided}</p>
                  </div>
                </div>
              )}
              
              {clientInfo?.service_start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">תאריך תחילת שירות</p>
                    <p className="text-base text-foreground">
                      {new Date(clientInfo.service_start_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
              )}
              
              {clientInfo?.assigned_employees && clientInfo.assigned_employees.length > 0 && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">עובדים מוקצים</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {clientInfo.assigned_employees.map((employee: { id: number; name: string | null }) => (
                        <Badge key={employee.id} variant="secondary" className="text-xs">
                          {employee.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Summary Card */}
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                סיכום משימות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-foreground">
                    {tasks?.filter(t => t.status === "pending").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">ממתין</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">
                    {tasks?.filter(t => t.status === "in_progress").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">בביצוע</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-green-600">
                    {tasks?.filter(t => t.status === "completed").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">הושלם</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  המשימות שלך
                </CardTitle>
                <CardDescription className="mt-1">
                  עקוב אחר כל המשימות שהוקצו לך
                </CardDescription>
              </div>
              <div className="w-48">
                <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
                  סינון לפי סטטוס
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="כל הסטטוסים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="in_progress">בביצוע</SelectItem>
                    <SelectItem value="completed">הושלם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : filteredTasks && filteredTasks.length > 0 ? (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {task.title || "משימה ללא כותרת"}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusColor(task.status)} className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.assigned_user && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {task.assigned_user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span>{task.assigned_user.name}</span>
                          </div>
                        )}
                        
                        {task.frequency && (
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyLabel(task.frequency)}
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(task.created_at).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">לא נמצאו משימות</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all" 
                    ? `אין משימות ${getStatusLabel(statusFilter)} כרגע`
                    : "עדיין לא הוקצו לך משימות"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientDashboard;
