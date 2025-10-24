import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, User, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  chat_status: string | null;
  chat_history: string | null;
  created_at: string;
  user_id: number;
  user_name?: string;
  frequency?: string | null;
}

interface User {
  id: number;
  name: string;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    user_id: "",
    frequency: "one_time",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch users to get names
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name");

      if (usersError) throw usersError;

      setUsers(usersData || []);

      // Map user names to tasks
      const usersMap = new Map(usersData?.map((u) => [u.id, u.name]) || []);
      const tasksWithUsers = tasksData?.map((task) => ({
        ...task,
        user_name: usersMap.get(task.user_id) || "Unknown User",
      })) || [];

      setTasks(tasksWithUsers);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.chat_status === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getFrequencyLabel = (frequency: string | null) => {
    switch (frequency) {
      case "one_time":
        return "One Time";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly (3 months)";
      case "semi_annually":
        return "Semi-Annually (6 months)";
      case "annually":
        return "Annually";
      default:
        return "One Time";
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.user_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("tasks").insert([{
        title: newTask.title,
        description: newTask.description,
        user_id: parseInt(newTask.user_id),
        frequency: newTask.frequency as any,
        status: "pending",
      }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setAddTaskOpen(false);
      setNewTask({
        title: "",
        description: "",
        user_id: "",
        frequency: "one_time",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleViewChatHistory = (task: Task) => {
    setSelectedTask(task);
    setChatHistoryOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
            <p className="text-muted-foreground">
              View and manage all employee requests and tasks
            </p>
          </div>
          <Button onClick={() => setAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.title || "Untitled"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {task.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {task.user_name}
                        </div>
                      </TableCell>
                      <TableCell>{getFrequencyLabel(task.frequency)}</TableCell>
                      <TableCell>
                        {task.status && (
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.chat_status && (
                          <Badge className={getPriorityColor(task.chat_status)}>
                            {task.chat_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(task.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewChatHistory(task)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Chat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description"
              />
            </div>
            <div>
              <Label htmlFor="user">Assign To *</Label>
              <Select
                value={newTask.user_id}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, user_id: value })
                }
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={newTask.frequency}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, frequency: value })
                }
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                  <SelectItem value="semi_annually">Semi-Annually (6 months)</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog */}
      <Dialog open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title || "Task Chat History"}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description || "No description"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Assigned To</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.user_name}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Frequency</h4>
                <p className="text-sm text-muted-foreground">
                  {getFrequencyLabel(selectedTask.frequency)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chat History</h4>
                <div className="rounded-md border bg-muted/50 p-4 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {selectedTask.chat_history || "No chat history available"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
