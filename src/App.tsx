import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import ScheduledTasks from "./pages/ScheduledTasks";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeProtectedRoute from "./components/EmployeeProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduled-tasks"
              element={
                <ProtectedRoute>
                  <ScheduledTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-dashboard"
              element={
                <EmployeeProtectedRoute>
                  <EmployeeDashboard />
                </EmployeeProtectedRoute>
              }
            />
            <Route
              path="/client-dashboard"
              element={
                <ClientProtectedRoute>
                  <ClientDashboard />
                </ClientProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
