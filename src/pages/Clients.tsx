import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  client_type: string | null;
  services_provided: string | null;
  service_start_date: string | null;
  assigned_employee_id: number | null;
  users: {
    name: string | null;
  } | null;
}

interface User {
  id: number;
  name: string | null;
  role: string | null;
}

const Clients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    client_type: "",
    services_provided: "",
    service_start_date: "",
    assigned_employee_id: "",
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, users(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("role", "employee");

      if (error) throw error;
      return data as User[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (newClient: typeof formData) => {
      const { error } = await supabase.from("clients").insert([
        {
          name: newClient.name,
          client_type: newClient.client_type || null,
          services_provided: newClient.services_provided || null,
          service_start_date: newClient.service_start_date || null,
          assigned_employee_id: newClient.assigned_employee_id
            ? parseInt(newClient.assigned_employee_id)
            : null,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      setIsOpen(false);
      setFormData({
        name: "",
        client_type: "",
        services_provided: "",
        service_start_date: "",
        assigned_employee_id: "",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create client: ${error.message}`,
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete client: ${error.message}`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_type">Client Type</Label>
                  <Input
                    id="client_type"
                    value={formData.client_type}
                    onChange={(e) =>
                      setFormData({ ...formData, client_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="services_provided">Services Provided</Label>
                  <Input
                    id="services_provided"
                    value={formData.services_provided}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        services_provided: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="service_start_date">Service Start Date</Label>
                  <Input
                    id="service_start_date"
                    type="date"
                    value={formData.service_start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_employee">Assign Employee</Label>
                  <Select
                    value={formData.assigned_employee_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_employee_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={employee.id.toString()}
                        >
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Create Client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client Type</TableHead>
                <TableHead>Services Provided</TableHead>
                <TableHead>Service Start Date</TableHead>
                <TableHead>Assigned Employee</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.client_type || "-"}</TableCell>
                  <TableCell>{client.services_provided || "-"}</TableCell>
                  <TableCell>
                    {client.service_start_date
                      ? new Date(client.service_start_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{client.users?.name || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteClient.mutate(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Clients;
