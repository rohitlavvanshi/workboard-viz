import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Eye } from "lucide-react";

interface Task {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  frequency: string | null;
  scheduled_day: number | null;
  user_id: number;
  chat_history: string | null;
  created_at: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchUserAndTasks();
  }, []);

  const fetchUserAndTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) throw userError;
      
      setUserName(userData.name || "עובד");

      // Fetch user's tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "שגיאה",
        description: "נכשל בטעינת משימות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditStatus(task.status || "pending");
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: editStatus })
        .eq("id", selectedTask.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "המשימה עודכנה בהצלחה",
      });

      setIsEditDialogOpen(false);
      fetchUserAndTasks();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "שגיאה",
        description: "נכשל בעדכון משימה",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (task: Task) => {
    setSelectedTask(task);
    setIsHistoryDialogOpen(true);
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
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
      default:
        return frequency || "לא זמין";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "הושלם";
      case "in_progress":
        return "בביצוע";
      case "pending":
        return "ממתין";
      default:
        return status || "לא זמין";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">המשימות שלי</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">ברוך הבא, {userName}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 me-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>כותרת</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תדירות</TableHead>
                <TableHead>נוצר ב</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    עדיין לא הוקצו משימות
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title || "לא זמין"}</TableCell>
                    <TableCell>{task.description || "לא זמין"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getFrequencyLabel(task.frequency)}</TableCell>
                    <TableCell>{formatDate(task.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          עדכן סטטוס
                        </Button>
                        {task.chat_history && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עדכון סטטוס משימה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">משימה</label>
              <p className="text-sm text-muted-foreground">{selectedTask?.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">סטטוס</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateTask}>עדכן</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>היסטוריית צ'אט משימה</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {selectedTask?.chat_history || "אין היסטוריית צ'אט זמינה"}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;
