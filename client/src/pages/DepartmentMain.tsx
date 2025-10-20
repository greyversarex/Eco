import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DepartmentCard from '@/components/DepartmentCard';
import { useTranslation, type Language } from '@/lib/i18n';
import { Inbox, Send, PenSquare, LogOut, Leaf } from 'lucide-react';

// todo: remove mock functionality
const mockDepartments = {
  upper: [
    { id: '1', name: 'Раёсати Душанбе', unreadCount: 3 },
    { id: '2', name: 'Агентии обухаводонимоси', unreadCount: 0 },
    { id: '3', name: 'Сарраёсати Вилоҷи Суғд', unreadCount: 1 },
    { id: '4', name: 'Сарраёсати ВМКБ', unreadCount: 0 },
  ],
  middle: [
    { id: '5', name: 'Раёсати мониторинги сифати экологӣ', unreadCount: 2 },
    { id: '6', name: 'Шуъба аз Вилоҷи НТҲ', unreadCount: 0 },
    { id: '7', name: 'Раёсати назорати давлатии истифода', unreadCount: 0 },
    { id: '8', name: 'Раёсати биологияҳои мухосибат', unreadCount: 1 },
  ],
  lower: [
    { id: '9', name: 'Муассисаи давлатии "Худудхои табиӣ"', unreadCount: 0 },
    { id: '10', name: 'Муассисаидавлатии "Лаборатория"', unreadCount: 0 },
    { id: '11', name: 'Маркази стандартгузорӣ', unreadCount: 0 },
    { id: '12', name: 'Маркази назорати тахлилнок', unreadCount: 4 },
  ],
};

export default function DepartmentMain() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);

  const handleDepartmentClick = (departmentId: string) => {
    console.log('Navigating to messages for department:', departmentId);
    setLocation('/department/inbox');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">ЭкоТочикистон</h1>
                <p className="text-xs text-muted-foreground">
                  {lang === 'tg' ? 'Раёсати Душанбе' : 'Управление Душанбе'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/department/inbox')}
                  data-testid="button-inbox"
                  className="gap-2"
                >
                  <Inbox className="h-4 w-4" />
                  {t.inbox}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/department/outbox')}
                  data-testid="button-outbox"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t.outbox}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLocation('/department/compose')}
                  data-testid="button-compose"
                  className="gap-2"
                >
                  <PenSquare className="h-4 w-4" />
                  {t.newMessage}
                </Button>
              </nav>
              <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Logging out');
                  setLocation('/');
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">{t.upperBlock}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockDepartments.upper.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  name={dept.name}
                  unreadCount={dept.unreadCount}
                  onClick={() => handleDepartmentClick(dept.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">{t.middleBlock}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockDepartments.middle.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  name={dept.name}
                  unreadCount={dept.unreadCount}
                  onClick={() => handleDepartmentClick(dept.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">{t.lowerBlock}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockDepartments.lower.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  name={dept.name}
                  unreadCount={dept.unreadCount}
                  onClick={() => handleDepartmentClick(dept.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
