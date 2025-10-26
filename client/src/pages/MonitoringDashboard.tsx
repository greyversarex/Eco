import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import DepartmentCard from '@/components/DepartmentCard';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import { useQuery } from '@tanstack/react-query';
import logoImage from '@assets/logo-optimized.webp';

interface DepartmentStats {
  id: number;
  name: string;
  block: string;
  unreadCount: number;
}

export default function MonitoringDashboard() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);

  const { data: stats = [], isLoading } = useQuery<DepartmentStats[]>({
    queryKey: ['/api/monitoring/unread-stats'],
  });

  const groupedDepartments = {
    upper: stats.filter(d => d.block === 'upper'),
    middle: stats.filter(d => d.block === 'middle'),
    lower: stats.filter(d => d.block === 'lower'),
    district: stats.filter(d => d.block === 'district'),
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
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                data-testid="button-back"
                className="shrink-0 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <button 
                onClick={() => setLocation('/')}
                className="flex items-start gap-2 sm:gap-3 hover:opacity-80 transition-opacity pt-1"
                data-testid="button-home"
              >
                <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{t.monitoring}</h1>
                  <p className="text-xs text-white/90 drop-shadow-sm truncate">Портали электронӣ</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedDepartments.upper.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{t.upperBlock}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.upper.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={dept.unreadCount}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {groupedDepartments.middle.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{t.middleBlock}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.middle.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={dept.unreadCount}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {groupedDepartments.lower.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{t.lowerBlock}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.lower.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={dept.unreadCount}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {groupedDepartments.district.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{t.districtBlock}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.district.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      name={dept.name}
                      unreadCount={dept.unreadCount}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
