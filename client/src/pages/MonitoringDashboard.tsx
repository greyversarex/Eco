import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Leaf, Mail } from 'lucide-react';
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
  };

  const totalUnread = stats.reduce((sum, dept) => sum + dept.unreadCount, 0);

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
      
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md relative">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                data-testid="button-back"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <img src={logoImage} alt="Logo" className="h-8 w-8 object-contain shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{t.monitoring}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">ЭкоТоҷикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {lang === 'tg' ? 'Умумӣ хатҳои хонданашуда' : 'Всего непрочитанных сообщений'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{totalUnread}</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upper Block */}
            {groupedDepartments.upper.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-foreground">
                  {t.upperBlock}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.upper.map((dept) => (
                    <Card key={dept.id} className={dept.unreadCount > 0 ? 'border-primary/50' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Mail className={`h-4 w-4 ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dept.unreadCount} {t.unreadMessages}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Middle Block */}
            {groupedDepartments.middle.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-foreground">
                  {t.middleBlock}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.middle.map((dept) => (
                    <Card key={dept.id} className={dept.unreadCount > 0 ? 'border-primary/50' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Mail className={`h-4 w-4 ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dept.unreadCount} {t.unreadMessages}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Lower Block */}
            {groupedDepartments.lower.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-foreground">
                  {t.lowerBlock}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedDepartments.lower.map((dept) => (
                    <Card key={dept.id} className={dept.unreadCount > 0 ? 'border-primary/50' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Mail className={`h-4 w-4 ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${dept.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dept.unreadCount} {t.unreadMessages}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
