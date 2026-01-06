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
import { Users as UsersIcon, Mail, Briefcase, Plus, Trash2, MessageSquare, ListTodo, Pencil, Filter } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  chat_history: string | null;
  category: string | null;
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
  name: z.string().trim().min(1, { message: "שם הוא שדה חובה" }).max(100, { message: "השם חייב להיות פחות מ-100 תווים" }),
  countryCode: z.string().trim().min(1, { message: "קוד מדינה הוא שדה חובה" }),
  phoneNumber: z.string().trim().min(1, { message: "מספר טלפון הוא שדה חובה" }).regex(/^\d+$/, { message: "מספר טלפון חייב להכיל רק מספרים" }),
  category: z.string().trim().min(1, { message: "קטגוריה היא שדה חובה" }).max(50, { message: "הקטגוריה חייבת להיות פחות מ-50 תווים" }),
});

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      countryCode: "+1",
      phoneNumber: "",
      category: "",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      countryCode: "+1",
      phoneNumber: "",
      category: "",
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

      setUsers((usersData || []) as unknown as User[]);
      setFilteredUsers((usersData || []) as unknown as User[]);
      setTaskCounts(counts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set((usersData || []).map((u: any) => u.category).filter(Boolean) as string[]));
      setCategories(uniqueCategories);
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
          category: values.category,
        }]);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "העובד נוסף בהצלחה",
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "שגיאה",
        description: "נכשל בהוספת עובד. נא לנסות שוב.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    // Parse phone number into country code and number
    let phone = user.phone || "";
    
    // Remove @c.us suffix if present
    phone = phone.replace(/@c\.us$/, '');
    
    // Try to extract country code (1-3 digits) and the rest
    // Assuming common country codes are 1-3 digits
    const match = phone.match(/^(\d{1,3})(\d+)$/);
    const countryCode = match?.[1] ? `+${match[1]}` : "+1";
    const phoneNumber = match?.[2] || phone;
    
    editForm.reset({
      name: user.name || "",
      countryCode: countryCode,
      phoneNumber: phoneNumber,
      category: user.category || "",
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userToEdit) return;
    
    try {
      setSubmitting(true);
      
      const fullPhone = `${values.countryCode}${values.phoneNumber}`;

      const { error } = await supabase
        .from("users")
        .update({
          name: values.name,
          phone: fullPhone,
          category: values.category,
        })
        .eq("id", userToEdit.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "העובד עודכן בהצלחה",
      });

      setEditDialogOpen(false);
      editForm.reset();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast({
        title: "שגיאה",
        description: error.message || "נכשל בעדכון עובד",
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
        title: "הצלחה",
        description: "העובד נמחק בהצלחה",
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "שגיאה",
        description: "נכשל במחיקת עובד. נא לנסות שוב.",
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
        title: "שגיאה",
        description: "נכשל בטעינת משימות",
        variant: "destructive",
      });
    }
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    if (category === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.category === category));
    }
  };

  const getFrequencyLabel = (frequency: string | null) => {
    switch (frequency) {
      case "one_time":
        return "חד פעמי";
      case "daily":
        return "יומי";
      case "monthly":
        return "חודשי";
      case "quarterly":
        return "רבעוני";
      case "semi_annually":
        return "חצי שנתי";
      case "annually":
        return "שנתי";
      default:
        return "חד פעמי";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-6 w-6 text-primary" />
                  <CardTitle>עובדים</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  ניהול וצפייה בכל העובדים בארגון שלך
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="סנן לפי קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף עובד
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>הוסף עובד חדש</DialogTitle>
                    <DialogDescription>
                      צור רשומת עובד חדשה. כל השדות נדרשים.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם *</FormLabel>
                            <FormControl>
                              <Input placeholder="הזן שם עובד" {...field} />
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
                              <FormLabel>קוד *</FormLabel>
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
                              <FormLabel>מספר טלפון *</FormLabel>
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
                       <FormField
                         control={form.control}
                         name="category"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>קטגוריה *</FormLabel>
                             <FormControl>
                               <Input placeholder="הזן קטגוריה (לדוגמה: מכירות, IT, משאבי אנוש)" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <DialogFooter>
                         <Button type="submit" disabled={submitting}>
                           {submitting ? "מוסיף..." : "הוסף עובד"}
                         </Button>
                       </DialogFooter>
                     </form>
                   </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
           <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {categoryFilter === "all" ? "לא נמצאו עובדים" : `לא נמצאו עובדים בקטגוריית "${categoryFilter}"`}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>שם</TableHead>
                       <TableHead>טלפון</TableHead>
                       <TableHead>קטגוריה</TableHead>
                       <TableHead>תפקיד</TableHead>
                       <TableHead className="text-right">סה"כ משימות</TableHead>
                       <TableHead className="text-right">היסטוריית צ'אט</TableHead>
                       <TableHead className="text-right">פעולות</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            {user.name || "לא זמין"}
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2 text-muted-foreground">
                             <Mail className="h-4 w-4" />
                             {user.phone || "לא זמין"}
                           </div>
                         </TableCell>
                         <TableCell>
                           {user.category ? (
                             <Badge variant="outline" className="capitalize">
                               {user.category}
                             </Badge>
                            ) : (
                              <span className="text-muted-foreground">לא זמין</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role ? (
                             <Badge variant="secondary" className="capitalize">
                               <Briefcase className="h-3 w-3 mr-1" />
                               {user.role}
                             </Badge>
                           ) : (
                             <span className="text-muted-foreground">לא זמין</span>
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
                            צפה בצ'אט
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
                              צפה במשימות
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(user)}
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
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
            <AlertDialogTitle>מחיקת עובד</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את {userToDelete?.name}? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat History Dialog */}
      <Dialog open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name || "עובד"} - היסטוריית צ'אט</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 overflow-y-auto pr-2">
              <div>
                <h4 className="font-semibold mb-2">פרטי עובד</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">שם:</span> {selectedUser.name || "לא זמין"}</p>
                  <p><span className="font-medium">טלפון:</span> {selectedUser.phone || "לא זמין"}</p>
                  <p><span className="font-medium">תפקיד:</span> {selectedUser.role || "לא זמין"}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">היסטוריית צ'אט</h4>
                <div className="rounded-md border bg-muted/50 p-4 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {selectedUser.chat_history || "אין היסטוריית צ'אט זמינה"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ערוך עובד</DialogTitle>
            <DialogDescription>
              עדכן פרטי עובד. כל השדות נדרשים.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם *</FormLabel>
                    <FormControl>
                      <Input placeholder="הזן שם עובד" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={editForm.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>קוד *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>מספר טלפון *</FormLabel>
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
                       <FormField
                         control={editForm.control}
                         name="category"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>קטגוריה *</FormLabel>
                             <FormControl>
                               <Input placeholder="הזן קטגוריה (לדוגמה: מכירות, IT, משאבי אנוש)" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <DialogFooter>
                         <Button type="submit" disabled={submitting}>
                           {submitting ? "מעדכן..." : "עדכן עובד"}
                         </Button>
                       </DialogFooter>
                     </form>
                   </Form>
                 </DialogContent>
               </Dialog>

      {/* Tasks Dialog */}
      <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name || "עובד"} - משימות</DialogTitle>
            <DialogDescription>
              כל המשימות שהוקצו לעובד זה
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            {userTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>לא הוקצו משימות לעובד זה</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>כותרת</TableHead>
                      <TableHead>תיאור</TableHead>
                      <TableHead>תדירות</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>נוצר</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.title || "ללא כותרת"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {task.description || "ללא תיאור"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getFrequencyLabel(task.frequency)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "default" : "outline"}>
                            {task.status === "completed" ? "הושלם" : task.status === "in_progress" ? "בביצוע" : "ממתין"}
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
