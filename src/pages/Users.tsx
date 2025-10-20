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
import { Users as UsersIcon, Mail, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

interface TaskCount {
  user_id: number;
  count: number;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
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
            <div className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-primary" />
              <CardTitle>Employees</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage and view all employees in your organization
            </p>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Users;
