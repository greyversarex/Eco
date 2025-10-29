import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, DepartmentRoute, AdminRoute, AuthenticatedRoute } from "@/lib/auth";

// Eager load critical pages
import DepartmentLogin from "@/pages/DepartmentLogin";
import AdminLogin from "@/pages/AdminLogin";

// Lazy load all other pages
const NotFound = lazy(() => import("@/pages/not-found"));
const DepartmentMain = lazy(() => import("@/pages/DepartmentMain"));
const DepartmentMessages = lazy(() => import("@/pages/DepartmentMessages"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const MessageView = lazy(() => import("@/pages/MessageView"));
const ComposeMessage = lazy(() => import("@/pages/ComposeMessage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminDepartments = lazy(() => import("@/pages/AdminDepartments"));
const AdminDepartmentMessages = lazy(() => import("@/pages/AdminDepartmentMessages"));
const MonitoringDashboard = lazy(() => import("@/pages/MonitoringDashboard"));
const AssignmentsPage = lazy(() => import("@/pages/AssignmentsPage"));
const AnnouncementsPage = lazy(() => import("@/pages/AnnouncementsPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">Боргирӣ...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/department/assignments">
          <DepartmentRoute>
            <AssignmentsPage />
          </DepartmentRoute>
        </Route>
        <Route path="/department/announcements">
          <DepartmentRoute>
            <AnnouncementsPage />
          </DepartmentRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
