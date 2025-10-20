import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DepartmentLogin from "@/pages/DepartmentLogin";
import AdminLogin from "@/pages/AdminLogin";
import DepartmentMain from "@/pages/DepartmentMain";
import Inbox from "@/pages/Inbox";
import MessageView from "@/pages/MessageView";
import ComposeMessage from "@/pages/ComposeMessage";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DepartmentLogin} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/department/main" component={DepartmentMain} />
      <Route path="/department/inbox" component={Inbox} />
      <Route path="/department/outbox" component={Inbox} />
      <Route path="/department/message/:id" component={MessageView} />
      <Route path="/department/compose" component={ComposeMessage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
