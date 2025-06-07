import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { authService } from "@/lib/auth";
import { User } from "@shared/schema";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/documents" component={() => <Dashboard user={user} onLogout={handleLogout} initialSection="documents" />} />
      <Route path="/templates" component={() => <Dashboard user={user} onLogout={handleLogout} initialSection="templates" />} />
      <Route path="/effort-estimation" component={() => <Dashboard user={user} onLogout={handleLogout} initialSection="effort-estimation" />} />
      <Route path="/chat" component={() => <Dashboard user={user} onLogout={handleLogout} initialSection="chat" />} />
      <Route path="/users" component={() => <Dashboard user={user} onLogout={handleLogout} initialSection="users" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sow-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
