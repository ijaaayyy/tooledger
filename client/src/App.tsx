import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import StudentDashboard from "@/pages/student-dashboard";
import StudentWelcome from "@/pages/student-welcome";
import AdminLayout from "@/pages/admin/layout";
import AdminWelcome from "@/pages/admin/welcome";
import { Loader2 } from "lucide-react";

function AuthenticatedRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (location !== "/login" && location !== "/register") {
      return <Redirect to="/login" />;
    }
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Admin routing
  if (user.role === "admin") {
    return (
      <Switch>
        <Route path="/admin/welcome" component={AdminWelcome} />
        <Route path="/admin/:rest*">
          <AdminLayout />
        </Route>
        <Route path="/admin">
          <AdminLayout />
        </Route>
        <Route>
          <Redirect to="/admin/welcome" />
        </Route>
      </Switch>
    );
  }

  // Student routing
  if (location.startsWith("/admin")) {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/welcome" component={StudentWelcome} />
      <Route path="/" component={StudentDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AuthenticatedRoutes />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
