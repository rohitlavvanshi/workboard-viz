import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon, Mail, Briefcase, Plus, Trash2, MessageSquare, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface User {
  id: number;
  name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  chat_history: string | null;
}

interface TaskCount {
  user_id: number;
  count: number;
}

interface Task {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  frequency: string | null;
  created_at: string;
}

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  countryCode: z.string().trim().min(1, { message: "Country code is required" }),
  phoneNumber: z.string().trim().min(1, { message: "Phone number is required" }).regex(/^\d+$/, { message: "Phone number must contain only numbers" }),
});

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      countryCode: "+1",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription for new users
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch task counts
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("user_id");

      if (tasksError) throw tasksError;

      // Count tasks per user
      const counts: Record<number, number> = {};
      tasksData?.forEach((task) => {
        counts[task.user_id] = (counts[task.user_id] || 0) + 1;
      });

      setUsers(usersData || []);
      setTaskCounts(counts);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      
      // Remove "+" sign from country code and combine with phone number
      const cleanCountryCode = values.countryCode.replace(/\+/g, '');
      let fullPhone = `${cleanCountryCode}${values.phoneNumber}`;
      
      // Append @c.us if not already present
      if (!fullPhone.endsWith("@c.us")) {
        fullPhone = `${fullPhone}@c.us`;
      }

      const { error } = await supabase
        .from("users")
        .insert([{
          name: values.name,
          phone: fullPhone,
          role: "employee",
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee added successfully",
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchUserTasks = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUserTasks(data || []);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    }
  };

  const getFrequencyLabel = (frequency: string | null) => {
    switch (frequency) {
      case "one_time":
        return "One Time";
      case "daily":
        return "Daily";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "semi_annually":
        return "Semi-Annually";
      case "annually":
        return "Annually";
      default:
        return "One Time";
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-6 w-6 text-primary" />
                  <CardTitle>Employees</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage and view all employees in your organization
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Create a new employee record. All fields are required.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter employee name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="1234567890" 
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Adding..." : "Add Employee"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Total Tasks</TableHead>
                      <TableHead className="text-right">Chat History</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            {user.name || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {user.phone || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role ? (
                            <Badge variant="secondary" className="capitalize">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {user.role}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {taskCounts[user.id] || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setChatHistoryOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Chat
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                fetchUserTasks(user.id);
                                setTasksDialogOpen(true);
                              }}
                            >
                              <ListTodo className="h-4 w-4 mr-2" />
                              View Tasks
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat History Dialog */}
      <Dialog open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name || "Employee"} - Chat History</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 overflow-y-auto pr-2">
              <div>
                <h4 className="font-semibold mb-2">Employee Details</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">Name:</span> {selectedUser.name || "N/A"}</p>
                  <p><span className="font-medium">Phone:</span> {selectedUser.phone || "N/A"}</p>
                  <p><span className="font-medium">Role:</span> {selectedUser.role || "N/A"}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chat History</h4>
                <div className="rounded-md border bg-muted/50 p-4 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {selectedUser.chat_history || "No chat history available"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tasks Dialog */}
      <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name || "Employee"} - Tasks</DialogTitle>
            <DialogDescription>
              All tasks assigned to this employee
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            {userTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks assigned to this employee</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.title || "Untitled"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {task.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getFrequencyLabel(task.frequency)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "default" : "outline"}>
                            {task.status?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(task.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
