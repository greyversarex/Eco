import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MobileNav from '@/components/MobileNav';
import DepartmentCard from '@/components/DepartmentCard';
import { t } from '@/lib/i18n';
import { Inbox, Send, PenSquare, LogOut, Search, Eye, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import NotificationButton from '@/components/NotificationButton';

export default function DepartmentMain() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();

  const { data: departments = [], isLoading, dataUpdatedAt } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ['/api/messages/unread/by-department'],
  });

  const { data: counters } = useQuery<{ unreadAnnouncements: number; uncompletedAssignments: number }>({
    queryKey: ['/api/counters'],
  });

  // Filter departments by search query
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group departments by block and sort by sortOrder
  const departmentsByBlock = {
    // Unread messages block - only departments with unread messages
    unread: filteredDepartments
      .filter((d) => (unreadCounts[d.id] || 0) > 0)
      .sort((a, b) => (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0)), // Sort by most unread first
    upper: filteredDepartments.filter((d) => d.block === 'upper').sort((a, b) => a.sortOrder - b.sortOrder),
    middle: filteredDepartments.filter((d) => d.block === 'middle').sort((a, b) => a.sortOrder - b.sortOrder),
    lower: filteredDepartments.filter((d) => d.block === 'lower').sort((a, b) => a.sortOrder - b.sortOrder),
    district: filteredDepartments.filter((d) => d.block === 'district').sort((a, b) => a.sortOrder - b.sortOrder),
  };

  const handleDepartmentClick = (departmentId: number) => {
    setLocation(`/department/messages/${departmentId}`);
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
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 min-w-0 flex-1 md:flex-initial">
            <button 
              onClick={() => setLocation('/department/main')}
              className="flex items-start gap-2 min-w-0 hover:opacity-80 transition-opacity pt-2"
              data-testid="button-home"
            >
              <img src={logoImage} alt="Логотип" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">
                  {user?.userType === 'department' ? user.department?.name : ''}
                </h1>
                <p className="text-xs text-white/90 drop-shadow-sm truncate">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-1.5 sm:gap-2 md:gap-4">
            <nav className="hidden md:flex items-center gap-2.5">
              <Button
                size="default"
                onClick={() => setLocation('/department/inbox')}
                data-testid="button-inbox"
                className="gap-2.5 bg-white text-green-700 hover:bg-white/90 font-medium px-5 h-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-green-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                  <Inbox className="h-4 w-4 text-green-700" />
                </div>
                <span className="font-semibold">{t.inbox}</span>
              </Button>
              <Button
                size="default"
                onClick={() => setLocation('/department/outbox')}
                data-testid="button-outbox"
                className="gap-2.5 bg-white text-green-700 hover:bg-white/90 font-medium px-5 h-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-green-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                  <Send className="h-4 w-4 text-green-700" />
                </div>
                <span className="font-semibold">{t.outbox}</span>
              </Button>
              <Button
                size="default"
                onClick={() => setLocation('/department/compose')}
                data-testid="button-compose"
                className="gap-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 font-medium px-5 h-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                  <PenSquare className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">{t.newMessage}</span>
              </Button>
              <Button
                size="icon"
                onClick={() => setLocation('/department/trash')}
                data-testid="button-trash"
                className="bg-red-500 text-white hover:bg-red-600 h-11 w-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <NotificationButton variant="desktop" />
            </nav>
            <MobileNav 
              translations={{
                inbox: t.inbox,
                outbox: t.outbox,
                newMessage: t.newMessage,
                trash: t.trash,
                menu: t.menu,
              }}
            />
            <div className="hidden sm:flex items-center gap-2">
              <Button
                size="default"
                onClick={logout}
                data-testid="button-logout"
                className="gap-2.5 bg-red-500 hover:bg-red-600 text-white font-medium px-5 h-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">Баромад</span>
              </Button>
            </div>
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
            {/* Кнопки и поисковик */}
            <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
              <Button
                size="lg"
                className="shrink-0 relative bg-[#4a9d4a] hover:bg-[#3d8a3d] text-white font-medium pl-[36px] pr-[36px] h-11 rounded-md shadow-sm"
                data-testid="button-requests"
                onClick={() => setLocation('/department/assignments')}
              >
                Супоришҳо
                {counters && counters.uncompletedAssignments > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {counters.uncompletedAssignments}
                  </span>
                )}
              </Button>
              <Button
                size="lg"
                className="shrink-0 relative bg-[#4a9d4a] hover:bg-[#3d8a3d] text-white font-medium px-8 h-11 rounded-md shadow-sm pl-[36px] pr-[36px]"
                data-testid="button-announcements"
                onClick={() => setLocation('/department/announcements')}
              >
                Эълонҳо
                {counters && counters.unreadAnnouncements > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {counters.unreadAnnouncements}
                  </span>
                )}
              </Button>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ҷустуҷӯ"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border border-gray-300 focus:border-primary bg-white rounded-md"
                  data-testid="input-search"
                />
              </div>
              {user?.userType === 'department' && user.department?.canMonitor && (
                <Button
                  size="lg"
                  className="shrink-0 bg-[#4a9d4a] hover:bg-[#3d8a3d] text-white font-medium px-8 h-11 rounded-md shadow-sm pl-[36px] pr-[36px] gap-2"
                  data-testid="button-monitoring"
                  onClick={() => setLocation('/department/monitoring')}
                >
                  <Eye className="h-4 w-4" />
                  Назорат
                </Button>
              )}
            </div>

            {/* Unread messages block - only show on mobile/small screens */}
            {departmentsByBlock.unread.length > 0 && (
              <div className="space-y-4 md:hidden">
                <h2 className="text-xl font-semibold text-red-600 px-2">Паёмҳои нохондашуда</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {departmentsByBlock.unread.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      departmentId={dept.id}
                      name={dept.name}
                      icon={dept.icon}
                      iconVersion={dataUpdatedAt}
                      unreadCount={unreadCounts[dept.id] || 0}
                      onClick={() => handleDepartmentClick(dept.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Separator between unread and regular blocks */}
            {departmentsByBlock.unread.length > 0 && departmentsByBlock.upper.length > 0 && (
              <div className="relative py-4 md:hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-4 border-red-500/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                </div>
              </div>
            )}

            {departmentsByBlock.upper.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-2">{t.upperBlock}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {departmentsByBlock.upper.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      departmentId={dept.id}
                      name={dept.name}
                      icon={dept.icon}
                      iconVersion={dataUpdatedAt}
                      unreadCount={unreadCounts[dept.id] || 0}
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
                      departmentId={dept.id}
                      name={dept.name}
                      icon={dept.icon}
                      iconVersion={dataUpdatedAt}
                      unreadCount={unreadCounts[dept.id] || 0}
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
                      departmentId={dept.id}
                      name={dept.name}
                      icon={dept.icon}
                      iconVersion={dataUpdatedAt}
                      unreadCount={unreadCounts[dept.id] || 0}
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
                      departmentId={dept.id}
                      name={dept.name}
                      icon={dept.icon}
                      iconVersion={dataUpdatedAt}
                      unreadCount={unreadCounts[dept.id] || 0}
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
