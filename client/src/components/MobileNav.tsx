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
      <SheetContent 
        side="right" 
        className="w-[300px] flex flex-col bg-cover bg-center"
        style={{
          backgroundImage: `url(data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgb(250,252,250);stop-opacity:1" /><stop offset="100%" style="stop-color:rgb(240,248,240);stop-opacity:1" /></linearGradient></defs><rect fill="url(#bg)" width="400" height="800"/></svg>')})`,
          backgroundColor: 'rgba(255, 255, 255, 0.98)'
        }}
      >
        <SheetHeader className="border-b pb-4 bg-white/80 backdrop-blur-sm">
          <SheetTitle className="text-lg">{translations.menu}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2.5 mt-5 flex-1">
          <Button
            className="justify-start gap-2.5 h-12 text-sm font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/main')}
            data-testid="mobile-nav-departments"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span>{translations.departments}</span>
          </Button>
          <Button
            className="justify-start gap-2.5 h-12 text-sm font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/inbox')}
            data-testid="mobile-nav-inbox"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Inbox className="h-4 w-4 text-white" />
            </div>
            <span>{translations.inbox}</span>
          </Button>
          <Button
            className="justify-start gap-2.5 h-12 text-sm font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/outbox')}
            data-testid="mobile-nav-outbox"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Send className="h-4 w-4 text-white" />
            </div>
            <span>{translations.outbox}</span>
          </Button>
          <Button
            className="justify-start gap-2.5 h-12 text-sm font-medium bg-primary hover:bg-primary/90 shadow-md"
            onClick={() => navigateTo('/department/compose')}
            data-testid="mobile-nav-compose"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <PenSquare className="h-4 w-4 text-white" />
            </div>
            <span>{translations.newMessage}</span>
          </Button>
        </div>
        <div className="border-t pt-4 space-y-3 bg-white/80 backdrop-blur-sm">
          <div className="px-2 space-y-2">
            <span className="text-xs text-muted-foreground block">{lang === 'tg' ? 'Забон' : 'Язык'}</span>
            <div className="flex gap-2">
              <Button
                variant={lang === 'tg' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-9 text-sm font-medium"
                onClick={() => onLanguageChange('tg')}
              >
                ТҶ
              </Button>
              <Button
                variant={lang === 'ru' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-9 text-sm font-medium"
                onClick={() => onLanguageChange('ru')}
              >
                RU
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-11 text-sm font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
            data-testid="mobile-nav-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>{lang === 'tg' ? 'Баромад' : 'Выход'}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
