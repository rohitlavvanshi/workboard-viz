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
        
        // Get client ID
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();
        
        if (clientData) {
          setClientId(clientData.id);
        }
      }
    };

    getCurrentUser();
  }, []);

  // Fetch client information
  const { data: clientInfo, isLoading: isLoadingClient } = useQuery({
    queryKey: ["clientInfo", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          assigned_employee:assigned_employee_id (
            id,
            name
          )
        `)
        .eq("auth_user_id", currentUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
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
      title: "Logged out successfully",
      description: "See you next time!",
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
                  Welcome, {clientInfo?.name}
                </h1>
                <p className="text-sm text-muted-foreground">Client Portal</p>
              </div>
              {clientInfo?.client_type && (
                <Badge variant="secondary" className="ml-2">
                  {clientInfo.client_type}
                </Badge>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
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
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientInfo?.services_provided && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Services Provided</p>
                    <p className="text-base text-foreground">{clientInfo.services_provided}</p>
                  </div>
                </div>
              )}
              
              {clientInfo?.service_start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Start Date</p>
                    <p className="text-base text-foreground">
                      {new Date(clientInfo.service_start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              {clientInfo?.assigned_employee && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Employee</p>
                    <p className="text-base text-foreground">{clientInfo.assigned_employee.name}</p>
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
                Task Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-foreground">
                    {tasks?.filter(t => t.status === "pending").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Pending</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">
                    {tasks?.filter(t => t.status === "in_progress").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">In Progress</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-green-600">
                    {tasks?.filter(t => t.status === "completed").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Completed</p>
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
                  Your Tasks
                </CardTitle>
                <CardDescription className="mt-1">
                  Track all tasks assigned to you
                </CardDescription>
              </div>
              <div className="w-48">
                <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
                  Filter by Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                            {task.title || "Untitled Task"}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusColor(task.status)} className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status || "pending"}
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
                            {task.frequency.replace('_', ' ')}
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(task.created_at).toLocaleDateString()}
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
                <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all" 
                    ? `No ${statusFilter.replace('_', ' ')} tasks at the moment`
                    : "You don't have any tasks assigned yet"}
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
