import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import DepartmentCard from '@/components/DepartmentCard';
import { useTranslation, type Language } from '@/lib/i18n';
import { LogOut, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Department, Message } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';

export default function AdminDepartments() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { logout } = useAuth();

  const { data: departments = [], isLoading: deptLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: allMessages = [], isLoading: msgLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const isLoading = deptLoading || msgLoading;

  // Group departments by block
  const departmentsByBlock = {
    upper: departments.filter((d) => d.block === 'upper'),
    middle: departments.filter((d) => d.block === 'middle'),
    lower: departments.filter((d) => d.block === 'lower'),
    district: departments.filter((d) => d.block === 'district'),
  };

  // Calculate message counts for each department (both sent and received)
  const getMessageCountForDepartment = (deptId: number) => {
    return allMessages.filter(
      (msg) => msg.senderId === deptId || msg.recipientId === deptId
    ).length;
  };

  const handleDepartmentClick = (departmentId: number) => {
    setLocation(`/admin/department/${departmentId}`);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ 
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div 
        className="absolute inset-0" 
        style={{
          background: 'rgba(255, 255, 255, 0.92)'
        }}
      />
      <header 
        className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-md relative"
        style={{
          background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
        }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1 pt-2">
              <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{t.adminPanel}</h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">Портали электронӣ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
                data-testid="button-settings"
                className="gap-2 hidden sm:flex text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">{lang === 'tg' ? 'Идора' : 'Управление'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
                data-testid="button-settings-mobile"
                className="sm:hidden text-white hover:bg-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {departmentsByBlock.upper.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.upperBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.upper.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={getMessageCountForDepartment(dept.id)}
                      onClick={() => handleDepartmentClick(dept.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {departmentsByBlock.upper.length > 0 && departmentsByBlock.middle.length > 0 && (
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-4 border-primary/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                </div>
              </div>
            )}

            {departmentsByBlock.middle.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.middleBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.middle.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={getMessageCountForDepartment(dept.id)}
                      onClick={() => handleDepartmentClick(dept.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {departmentsByBlock.middle.length > 0 && departmentsByBlock.lower.length > 0 && (
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-4 border-primary/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                </div>
              </div>
            )}

            {departmentsByBlock.lower.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.lowerBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.lower.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={getMessageCountForDepartment(dept.id)}
                      onClick={() => handleDepartmentClick(dept.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {departmentsByBlock.lower.length > 0 && departmentsByBlock.district.length > 0 && (
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-4 border-primary/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                </div>
              </div>
            )}

            {departmentsByBlock.district.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.districtBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.district.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={getMessageCountForDepartment(dept.id)}
                      onClick={() => handleDepartmentClick(dept.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {departments.length === 0 && (
              <div className="text-center p-12">
                <p className="text-muted-foreground">
                  {lang === 'tg' ? 'Ҳоло шуъбае нест' : 'Пока нет отделов'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
