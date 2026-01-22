import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, DepartmentRoute, AdminRoute, AuthenticatedRoute } from "@/lib/auth";
import { useOfflineDB, useOnlineStatus } from "@/hooks/use-offline";
import { useDrafts } from "@/hooks/use-drafts";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAppBadge } from "@/hooks/useAppBadge";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";

// Eager load critical pages
import DepartmentLogin from "@/pages/DepartmentLogin";
import AdminLogin from "@/pages/AdminLogin";

// Lazy load all other pages
const NotFound = lazy(() => import("@/pages/not-found"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const DepartmentMain = lazy(() => import("@/pages/DepartmentMain"));
const DepartmentMessages = lazy(() => import("@/pages/DepartmentMessages"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const MessageView = lazy(() => import("@/pages/MessageView"));
const ComposeMessage = lazy(() => import("@/pages/ComposeMessage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminDepartments = lazy(() => import("@/pages/AdminDepartments"));
const AdminDepartmentMessages = lazy(() => import("@/pages/AdminDepartmentMessages"));
const AdminPeople = lazy(() => import("@/pages/AdminPeople"));
const AdminDocumentTypes = lazy(() => import("@/pages/AdminDocumentTypes"));
const AdminDocumentTemplates = lazy(() => import("@/pages/AdminDocumentTemplates"));
const AdminVisualTemplates = lazy(() => import("@/pages/AdminVisualTemplates"));
const AssignmentsPage = lazy(() => import("@/pages/AssignmentsPage"));
const AnnouncementsPage = lazy(() => import("@/pages/AnnouncementsPage"));
const MonitoringPage = lazy(() => import("@/pages/MonitoringPage"));
const TrashPage = lazy(() => import("@/pages/TrashPage"));
const DraftsPage = lazy(() => import("@/pages/DraftsPage"));

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
        <Route path="/privacy" component={PrivacyPolicy} />
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
        <Route path="/admin/people">
          <AdminRoute>
            <AdminPeople />
          </AdminRoute>
        </Route>
        <Route path="/admin/document-types">
          <AdminRoute>
            <AdminDocumentTypes />
          </AdminRoute>
        </Route>
        <Route path="/admin/document-templates">
          <AdminRoute>
            <AdminDocumentTemplates />
          </AdminRoute>
        </Route>
        <Route path="/admin/visual-templates">
          <AdminRoute>
            <AdminVisualTemplates />
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
        <Route path="/department/monitoring">
          <DepartmentRoute>
            <MonitoringPage />
          </DepartmentRoute>
        </Route>
        <Route path="/department/trash">
          <DepartmentRoute>
            <TrashPage />
          </DepartmentRoute>
        </Route>
        <Route path="/department/drafts">
          <DepartmentRoute>
            <DraftsPage />
          </DepartmentRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function OfflineSync() {
  const isOnline = useOnlineStatus();
  const { syncAllPendingDrafts, pendingCount } = useDrafts();
  const isSyncing = useRef(false);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing.current) {
      // Auto-sync drafts when connection is restored
      console.log('📱 Алоқа барқарор шуд. Ҳамоҳангсозии лоиҳаҳо...');
      isSyncing.current = true;
      
      syncAllPendingDrafts().finally(() => {
        isSyncing.current = false;
      });
    }
  }, [isOnline, pendingCount, syncAllPendingDrafts]);

  return null;
}

function PushNotificationsManager() {
  usePushNotifications();
  return null;
}

function AppBadgeManager() {
  useAppBadge();
  return null;
}

function CacheInvalidationManager() {
  useCacheInvalidation();
  return null;
}

function App() {
  // Initialize IndexedDB
  const { isReady, error } = useOfflineDB();
  const isOnline = useOnlineStatus();

  if (error) {
    console.error('Failed to initialize offline database:', error);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          {isReady && (
            <>
              <OfflineSync />
              {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm z-50" data-testid="banner-offline">
                  Офлайн режим - сохранено: {new Date().toLocaleTimeString()}
                </div>
              )}
            </>
          )}
          <PushNotificationsManager />
          <AppBadgeManager />
          <CacheInvalidationManager />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
