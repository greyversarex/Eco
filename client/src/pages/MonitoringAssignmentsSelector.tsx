import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ClipboardList, Building2, LogOut } from 'lucide-react';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

export default function MonitoringAssignmentsSelector() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const monitoredIds = user?.userType === 'department'
    ? user.department?.monitoredAssignmentDeptIds || []
    : [];

  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/all'],
  });

  const monitoredDepartments = departments.filter(d => monitoredIds.includes(d.id));

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div 
        className="absolute inset-0" 
        style={{ background: 'rgba(255, 255, 255, 0.92)' }}
      />
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/department/main')}
              className="text-white hover:bg-white/20 shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-start gap-2 sm:gap-3">
              <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">
                  Назорати Супоришҳо
                </h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">EcoDoc - Портали электронӣ</p>
              </div>
            </div>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
              className="flex items-center gap-2 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Баромад</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Шуъбаро интихоб кунед барои дидани супоришҳо
        </p>
        <div className="space-y-3">
          {monitoredDepartments.map((dept) => (
            <Card
              key={dept.id}
              className="cursor-pointer hover-elevate transition-all"
              onClick={() => setLocation(`/department/monitoring/assignments/${dept.id}`)}
              data-testid={`card-monitored-dept-${dept.id}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-[#2d7d9a]/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[#2d7d9a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" data-testid={`text-dept-name-${dept.id}`}>{dept.name}</p>
                </div>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          {monitoredDepartments.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Шуъбаҳо барои назорат интихоб нашудаанд
              </p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
