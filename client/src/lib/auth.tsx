import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useOnlineStatus } from '@/hooks/use-offline';
import { offlineDB } from './offline-db';
import { apiRequest } from './queryClient';

interface Department {
  id: number;
  name: string;
  block: string;
  code: string;
  canMonitor: boolean;
  canCreateAssignmentFromMessage: boolean;
  canCreateAssignment: boolean;
  canApprove: boolean;
  monitoredAssignmentDeptIds?: number[] | null;
  isSubdepartment?: boolean;
  parentDepartmentId?: number | null;
}

interface AuthContextType {
  user: { userType: 'department'; department: Department } | { userType: 'admin'; admin: { id: number } } | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const [cachedUser, setCachedUser] = useState<any>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Try to load offline cached auth session on first load
  useEffect(() => {
    offlineDB.getAuthSession().then(user => {
      if (user) {
        setCachedUser(user);
      }
      setIsLoadingCache(false);
    }).catch(() => {
      setIsLoadingCache(false);
    });
  }, []);

  const { data: user, isLoading } = useQuery<{ userType: 'department'; department: Department } | { userType: 'admin'; admin: { id: number } }>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0, // Always fetch fresh auth data for security
    // Don't retry if offline - we'll use cached session instead
    enabled: isOnline || !cachedUser,
  });

  // Save authenticated user to offline storage for offline login
  useEffect(() => {
    if (user) {
      offlineDB.saveAuthSession(user).catch(err => {
        console.error('Failed to save auth session offline:', err);
      });
    }
  }, [user]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout', undefined);
    },
    onSuccess: async () => {
      await offlineDB.clearAuthSession();
      queryClient.clear();
      try {
        sessionStorage.removeItem('ecodoc_welcome_shown');
        sessionStorage.removeItem('dismissed_notifications');
      } catch {}
      setLocation('/');
    },
  });

  // Use cached session if offline and no online user data yet
  const effectiveUser = user || (isOnline === false && cachedUser ? cachedUser : null);
  const effectiveIsLoading = isLoadingCache || (isOnline && isLoading);

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading: effectiveIsLoading,
        logout: () => logoutMutation.mutate(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper components
export function DepartmentRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== 'department')) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== 'department') {
    return null;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== 'admin')) {
      setLocation('/royalty');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

// Authenticated route for both admins and departments
export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
