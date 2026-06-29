import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Login from "./pages/Login";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import NewShift from "./pages/NewShift";
import ShiftDetail from "./pages/ShiftDetail";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantDetail from "./pages/RestaurantDetail";
import ConflictResolution from "./pages/ConflictResolution";
import WorkersManagement from "./pages/WorkersManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: "supervisor" | "accountant" }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === "supervisor" ? "/supervisor" : "/admin"} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "supervisor" ? "/supervisor" : "/admin"} replace /> : <Login />} />
      <Route path="/supervisor" element={<ProtectedRoute role="supervisor"><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/supervisor/new-shift" element={<ProtectedRoute role="supervisor"><NewShift /></ProtectedRoute>} />
      <Route path="/supervisor/shift/:id" element={<ProtectedRoute role="supervisor"><ShiftDetail /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="accountant"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/restaurant/:name" element={<ProtectedRoute role="accountant"><RestaurantDetail /></ProtectedRoute>} />
      <Route path="/admin/conflicts" element={<ProtectedRoute role="accountant"><ConflictResolution /></ProtectedRoute>} />
      <Route path="/admin/workers" element={<ProtectedRoute role="accountant"><WorkersManagement /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
