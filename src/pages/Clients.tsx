import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Briefcase, Pencil, Calendar, Users as UsersIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  client_type: string | null;
  services_provided: string[] | null;
  service_start_date: string | null;
  assigned_employee_ids: number[] | null;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    client_type: "",
    services_provided: [] as string[],
    service_start_date: "",
    assigned_employee_ids: [] as number[],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    client_type: "",
    services_provided: [] as string[],
    service_start_date: "",
    assigned_employee_ids: [] as number[],
  });
  const [filterClientType, setFilterClientType] = useState<string>("all");
  const [filterServicesProvided, setFilterServicesProvided] = useState<string>("all");
  const [newService, setNewService] = useState("");
  const [editNewService, setEditNewService] = useState("");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
  });

  useEffect(() => {
    // Set up real-time subscription for clients changes
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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
          services_provided: newClient.services_provided.length > 0 ? newClient.services_provided : null,
          service_start_date: newClient.service_start_date || null,
          assigned_employee_ids: newClient.assigned_employee_ids.length > 0 ? newClient.assigned_employee_ids : null,
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
        services_provided: [],
        service_start_date: "",
        assigned_employee_ids: [],
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

  const updateClient = useMutation({
    mutationFn: async (data: { id: string; updates: typeof editFormData }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.updates.name,
          client_type: data.updates.client_type || null,
          services_provided: data.updates.services_provided.length > 0 ? data.updates.services_provided : null,
          service_start_date: data.updates.service_start_date || null,
          assigned_employee_ids: data.updates.assigned_employee_ids.length > 0 ? data.updates.assigned_employee_ids : null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setEditDialogOpen(false);
      setClientToEdit(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update client: ${error.message}`,
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
      setDeleteDialogOpen(false);
      setClientToDelete(null);
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

  const handleEditClick = (client: Client) => {
    setClientToEdit(client);
    setEditFormData({
      name: client.name,
      client_type: client.client_type || "",
      services_provided: client.services_provided || [],
      service_start_date: client.service_start_date || "",
      assigned_employee_ids: client.assigned_employee_ids || [],
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientToEdit) {
      updateClient.mutate({ id: clientToEdit.id, updates: editFormData });
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteClient.mutate(clientToDelete.id);
    }
  };

  const handleAddService = () => {
    const trimmedService = newService.trim();
    if (trimmedService && !formData.services_provided.includes(trimmedService)) {
      setFormData({
        ...formData,
        services_provided: [...formData.services_provided, trimmedService],
      });
      setNewService("");
    }
  };

  const handleAddEditService = () => {
    const trimmedService = editNewService.trim();
    if (trimmedService && !editFormData.services_provided.includes(trimmedService)) {
      setEditFormData({
        ...editFormData,
        services_provided: [...editFormData.services_provided, trimmedService],
      });
      setEditNewService("");
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setFormData({
      ...formData,
      services_provided: formData.services_provided.filter((s) => s !== serviceToRemove),
    });
  };

  const handleRemoveEditService = (serviceToRemove: string) => {
    setEditFormData({
      ...editFormData,
      services_provided: editFormData.services_provided.filter((s) => s !== serviceToRemove),
    });
  };

  // Get unique client types and services for filters
  const uniqueClientTypes = Array.from(
    new Set(clients?.map((c) => c.client_type).filter(Boolean))
  );
  const uniqueServices = Array.from(
    new Set(clients?.flatMap((c) => c.services_provided || []))
  ).sort();

  // Filter clients based on selected filters
  const filteredClients = clients?.filter((client) => {
    const matchesType =
      filterClientType === "all" || client.client_type === filterClientType;
    const matchesServices =
      filterServicesProvided === "all" ||
      (client.services_provided?.includes(filterServicesProvided) ?? false);
    return matchesType && matchesServices;
  });

  if (isLoading) {
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <CardTitle>Clients</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and view all clients in your organization
                </p>
              </div>
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
                    <DialogDescription>
                      Create a new client record. Name is required.
                    </DialogDescription>
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
                      <Label>Services Provided</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter service name..."
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddService();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddService}
                          variant="secondary"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {formData.services_provided.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.services_provided.map((service, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              {service}
                              <button
                                type="button"
                                onClick={() => handleRemoveService(service)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
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
                      <Label>Assign Employees</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between mt-2">
                            {formData.assigned_employee_ids.length > 0
                              ? `${formData.assigned_employee_ids.length} employee(s) selected`
                              : "Select employees..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search employees..." />
                            <CommandEmpty>No employees found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {employees?.map((employee) => (
                                <CommandItem
                                  key={employee.id}
                                  onSelect={() => {
                                    const isSelected = formData.assigned_employee_ids.includes(employee.id);
                                    if (isSelected) {
                                      setFormData({
                                        ...formData,
                                        assigned_employee_ids: formData.assigned_employee_ids.filter(
                                          (id) => id !== employee.id
                                        ),
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        assigned_employee_ids: [...formData.assigned_employee_ids, employee.id],
                                      });
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.assigned_employee_ids.includes(employee.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {employee.name || "Unnamed Employee"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {formData.assigned_employee_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.assigned_employee_ids.map((employeeId) => {
                            const employee = employees?.find((e) => e.id === employeeId);
                            return (
                              <Badge key={employeeId} variant="secondary" className="gap-1">
                                {employee?.name || "Unknown"}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      assigned_employee_ids: formData.assigned_employee_ids.filter(
                                        (id) => id !== employeeId
                                      ),
                                    });
                                  }}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full">
                        Create Client
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="filter-type" className="text-xs text-muted-foreground">
                  Filter by Client Type
                </Label>
                <Select value={filterClientType} onValueChange={setFilterClientType}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {uniqueClientTypes.map((type) => (
                      <SelectItem key={type} value={type!}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="filter-services" className="text-xs text-muted-foreground">
                  Filter by Services
                </Label>
                <Select
                  value={filterServicesProvided}
                  onValueChange={setFilterServicesProvided}
                >
                  <SelectTrigger id="filter-services">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {uniqueServices.map((service) => (
                      <SelectItem key={service} value={service!}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!clients || clients.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No clients found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Client Type</TableHead>
                      <TableHead>Services Provided</TableHead>
                      <TableHead>Service Start Date</TableHead>
                      <TableHead>Assigned Employee</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {client.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.client_type ? (
                            <Badge variant="outline" className="capitalize">
                              {client.client_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.services_provided && client.services_provided.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {client.services_provided.map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.service_start_date ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(client.service_start_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.assigned_employee_ids && client.assigned_employee_ids.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {client.assigned_employee_ids.map((employeeId) => {
                                const employee = employees?.find((emp) => emp.id === employeeId);
                                return (
                                  <Badge key={employeeId} variant="secondary" className="text-xs">
                                    <UsersIcon className="h-3 w-3 mr-1" />
                                    {employee?.name || `Employee ${employeeId}`}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(client)}
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(client)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {clientToDelete?.name}? This action cannot be undone.
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

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information. Name is required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Name *</Label>
              <Input
                id="edit_name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_client_type">Client Type</Label>
              <Input
                id="edit_client_type"
                value={editFormData.client_type}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, client_type: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Services Provided</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter service name..."
                  value={editNewService}
                  onChange={(e) => setEditNewService(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEditService();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAddEditService}
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
              
              {editFormData.services_provided.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editFormData.services_provided.map((service, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditService(service)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit_service_start_date">Service Start Date</Label>
              <Input
                id="edit_service_start_date"
                type="date"
                value={editFormData.service_start_date}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    service_start_date: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Assign Employees</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-2">
                    {editFormData.assigned_employee_ids.length > 0
                      ? `${editFormData.assigned_employee_ids.length} employee(s) selected`
                      : "Select employees..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandEmpty>No employees found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {employees?.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          onSelect={() => {
                            const isSelected = editFormData.assigned_employee_ids.includes(employee.id);
                            if (isSelected) {
                              setEditFormData({
                                ...editFormData,
                                assigned_employee_ids: editFormData.assigned_employee_ids.filter(
                                  (id) => id !== employee.id
                                ),
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                assigned_employee_ids: [...editFormData.assigned_employee_ids, employee.id],
                              });
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              editFormData.assigned_employee_ids.includes(employee.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {employee.name || "Unnamed Employee"}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {editFormData.assigned_employee_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editFormData.assigned_employee_ids.map((employeeId) => {
                    const employee = employees?.find((e) => e.id === employeeId);
                    return (
                      <Badge key={employeeId} variant="secondary" className="gap-1">
                        {employee?.name || "Unknown"}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => {
                            setEditFormData({
                              ...editFormData,
                              assigned_employee_ids: editFormData.assigned_employee_ids.filter(
                                (id) => id !== employeeId
                              ),
                            });
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                Update Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
