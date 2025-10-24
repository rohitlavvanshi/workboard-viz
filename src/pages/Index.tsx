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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, MessageSquare, User, Calendar, CalendarIcon, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [nameFilter, setNameFilter] = useState<string>("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  }, [tasks, statusFilter, priorityFilter, nameFilter, frequencyFilter, dateFilter]);

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

    if (nameFilter) {
      filtered = filtered.filter((task) =>
        task.title?.toLowerCase().includes(nameFilter.toLowerCase()) ||
        task.user_name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (frequencyFilter !== "all") {
      filtered = filtered.filter((task) => task.frequency === frequencyFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.created_at);
        return (
          taskDate.getDate() === dateFilter.getDate() &&
          taskDate.getMonth() === dateFilter.getMonth() &&
          taskDate.getFullYear() === dateFilter.getFullYear()
        );
      });
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

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from("tasks").insert([{
        title: newTask.title,
        description: newTask.description,
        user_id: parseInt(newTask.user_id),
        frequency: newTask.frequency as any,
        status: "pending",
      }]);

      if (error) throw error;

      // Get the user name for the webhook
      const assignedUser = users.find(u => u.id === parseInt(newTask.user_id));

      // Send data to webhook
      try {
        await fetch("https://alpharc.app.n8n.cloud/webhook/ad751273-410c-46d2-a41e-b3ae9f53e8ff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            user_id: parseInt(newTask.user_id),
            user_name: assignedUser?.name || "Unknown User",
            frequency: newTask.frequency,
            status: "pending",
            created_at: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error("Error sending to webhook:", webhookError);
        // Don't show error to user as task was created successfully
      }

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
    } finally {
      setIsSubmitting(false);
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
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setNameFilter("");
                setFrequencyFilter("all");
                setDateFilter(undefined);
              }}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Name/Title Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Frequency Filter */}
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="one_time">One Time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="text-sm text-muted-foreground">
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
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto pr-2">
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
              <Button variant="outline" onClick={() => setAddTaskOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog */}
      <Dialog open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title || "Task Chat History"}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 overflow-y-auto pr-2">
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
                <div className="rounded-md border bg-muted/50 p-4 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
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
