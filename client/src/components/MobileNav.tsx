import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Inbox, Send, PenSquare, Home, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import type { Language } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface MobileNavProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  translations: {
    inbox: string;
    outbox: string;
    newMessage: string;
    departments: string;
    menu: string;
  };
}

export default function MobileNav({ lang, onLanguageChange, translations }: MobileNavProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  const navigateTo = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="md:hidden text-white hover:bg-white/20"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl">{translations.menu}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 mt-6 flex-1">
          <Button
            className="justify-start gap-3 h-14 text-base font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/main')}
            data-testid="mobile-nav-departments"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span>{translations.departments}</span>
          </Button>
          <Button
            className="justify-start gap-3 h-14 text-base font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/inbox')}
            data-testid="mobile-nav-inbox"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <span>{translations.inbox}</span>
          </Button>
          <Button
            className="justify-start gap-3 h-14 text-base font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/outbox')}
            data-testid="mobile-nav-outbox"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Send className="h-5 w-5 text-white" />
            </div>
            <span>{translations.outbox}</span>
          </Button>
          <Button
            className="justify-start gap-3 h-14 text-base font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/compose')}
            data-testid="mobile-nav-compose"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <PenSquare className="h-5 w-5 text-white" />
            </div>
            <span>{translations.newMessage}</span>
          </Button>
        </div>
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-muted-foreground">{lang === 'tg' ? 'Забон' : 'Язык'}</span>
            <LanguageSwitcher currentLang={lang} onLanguageChange={onLanguageChange} />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 text-base font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
            data-testid="mobile-nav-logout"
          >
            <LogOut className="h-5 w-5" />
            <span>{lang === 'tg' ? 'Баромад' : 'Выход'}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
