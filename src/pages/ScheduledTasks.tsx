import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledTask {
  id: number;
  title: string | null;
  description: string | null;
  frequency: string | null;
  scheduled_day: number | null;
  status: string | null;
  created_at: string;
  user_id: number;
}

interface User {
  id: number;
  name: string | null;
}

const ScheduledTasks = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledTasks();
    fetchUsers();
    fetchClients();
  }, []);

  const fetchScheduledTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          clients(name)
        `)
        .eq("is_template", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching scheduled tasks:", error);
      toast({
        title: "שגיאה",
        description: "נכשל בטעינת משימות מתוזמנות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", deleteTaskId);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "המשימה נמחקה בהצלחה",
      });

      fetchScheduledTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "שגיאה",
        description: "נכשל במחיקת משימה",
        variant: "destructive",
      });
    } finally {
      setDeleteTaskId(null);
    }
  };

  const getFrequencyLabel = (frequency: string | null) => {
    const labels: Record<string, string> = {
      one_time: "חד פעמי",
      daily: "יומי",
      monthly: "חודשי",
      quarterly: "רבעוני",
      semi_annually: "חצי שנתי",
      annually: "שנתי",
    };
    return frequency ? labels[frequency] || frequency : "לא זמין";
  };

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "משתמש לא ידוע";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      completed: "הושלם",
      in_progress: "בביצוע",
      pending: "ממתין",
    };
    return status ? labels[status] || status : "ממתין";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">משימות מתוזמנות</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">טוען...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            לא נמצאו משימות מתוזמנות
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>שויך ל</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>תדירות</TableHead>
                  <TableHead>יום בחודש</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>נוצר</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {task.title || "לא זמין"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.description || "לא זמין"}
                    </TableCell>
                    <TableCell>{getUserName(task.user_id)}</TableCell>
                    <TableCell>
                      {(task as any).clients?.name ? (
                        <Badge variant="outline">{(task as any).clients.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">כל הלקוחות</span>
                      )}
                    </TableCell>
                    <TableCell>{getFrequencyLabel(task.frequency)}</TableCell>
                    <TableCell>
                      {task.scheduled_day ? `יום ${task.scheduled_day}` : "לא זמין"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(task.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTaskId(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={deleteTaskId !== null} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת משימה מתוזמנת</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק משימה מתוזמנת זו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScheduledTasks;
