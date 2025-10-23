import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, DepartmentRoute, AdminRoute, AuthenticatedRoute } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import DepartmentLogin from "@/pages/DepartmentLogin";
import AdminLogin from "@/pages/AdminLogin";
import DepartmentMain from "@/pages/DepartmentMain";
import DepartmentMessages from "@/pages/DepartmentMessages";
import Inbox from "@/pages/Inbox";
import MessageView from "@/pages/MessageView";
import ComposeMessage from "@/pages/ComposeMessage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminDepartments from "@/pages/AdminDepartments";
import AdminDepartmentMessages from "@/pages/AdminDepartmentMessages";
import MonitoringDashboard from "@/pages/MonitoringDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DepartmentLogin} />
      <Route path="/monitoring" component={MonitoringDashboard} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/departments">
        <AdminRoute>
          <AdminDepartments />
        </AdminRoute>
      </Route>
      <Route path="/admin/inbox">
        <Redirect to="/admin/departments" />
      </Route>
      <Route path="/admin/department/:id">
        <AdminRoute>
          <AdminDepartmentMessages />
        </AdminRoute>
      </Route>
      <Route path="/department/main">
        <DepartmentRoute>
          <DepartmentMain />
        </DepartmentRoute>
      </Route>
      <Route path="/department/messages/:id">
        <DepartmentRoute>
          <DepartmentMessages />
        </DepartmentRoute>
      </Route>
      <Route path="/department/inbox">
        <DepartmentRoute>
          <Inbox />
        </DepartmentRoute>
      </Route>
      <Route path="/department/outbox">
        <DepartmentRoute>
          <Inbox />
        </DepartmentRoute>
      </Route>
      <Route path="/department/message/:id">
        <AuthenticatedRoute>
          <MessageView />
        </AuthenticatedRoute>
      </Route>
      <Route path="/department/compose">
        <DepartmentRoute>
          <ComposeMessage />
        </DepartmentRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
