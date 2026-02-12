import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ClipboardList, Building2 } from 'lucide-react';
import type { Department } from '@shared/schema';

export default function MonitoringAssignmentsSelector() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const monitoredIds = user?.userType === 'department'
    ? user.department?.monitoredAssignmentDeptIds || []
    : [];

  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/all'],
  });

  const monitoredDepartments = departments.filter(d => monitoredIds.includes(d.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d6a2d] to-[#1a4a1a]">
      <div className="bg-gradient-to-r from-[#2d6a2d] to-[#1a5c1a] text-white p-4 flex items-center gap-3 sticky top-0 z-50">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={() => setLocation('/department/main')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Назорати Супоришҳо</h1>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        <p className="text-white/80 text-sm mb-4">
          Шуъбаро интихоб кунед барои дидани супоришҳо
        </p>
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
          <div className="text-center text-white/60 py-8">
            Шуъбаҳо барои назорат интихоб нашудаанд
          </div>
        )}
      </div>
    </div>
  );
}
