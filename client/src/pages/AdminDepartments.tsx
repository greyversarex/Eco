import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DepartmentCard from '@/components/DepartmentCard';
import { t } from '@/lib/i18n';
import { LogOut, Settings, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Department, Message } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

export default function AdminDepartments() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();

  const { data: departments = [], isLoading: deptLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: allMessages = [], isLoading: msgLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const isLoading = deptLoading || msgLoading;

  // Filter departments by search query
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group departments by block
  const departmentsByBlock = {
    upper: filteredDepartments.filter((d) => d.block === 'upper'),
    middle: filteredDepartments.filter((d) => d.block === 'middle'),
    lower: filteredDepartments.filter((d) => d.block === 'lower'),
    district: filteredDepartments.filter((d) => d.block === 'district'),
  };

  // Calculate message counts for each department (both sent and received)
  const getMessageCountForDepartment = (deptId: number) => {
    return allMessages.filter(
      (msg) => msg.senderId === deptId || msg.recipientId === deptId
    ).length;
  };

  const handleDepartmentClick = (departmentId: number) => {
    setLocation(`/royalty/department/${departmentId}`);
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
      <PageHeader variant="admin">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 sm:gap-3 min-w-0 flex-1 pt-2">
            <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0" />
            <div className="min-w-0 text-left">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">{t.adminPanel}</h1>
              <p className="text-xs text-white/70 hidden sm:block">EcoDoc - Портали электронӣ</p>
            </div>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2 sm:gap-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/royalty/dashboard')}
              data-testid="button-settings"
              className="gap-2 hidden sm:flex text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Идора</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/royalty/dashboard')}
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
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Поисковик */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ҷустуҷӯ"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-muted-foreground/20 focus:border-primary"
                  data-testid="input-search"
                />
              </div>
            </div>
            {departmentsByBlock.upper.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.upperBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.upper.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      icon={dept.icon}
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
                      icon={dept.icon}
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
                      icon={dept.icon}
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
                      icon={dept.icon}
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
                  Ҳоло шуъбае нест
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
