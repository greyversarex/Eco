import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, Inbox, Send, PenSquare, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import type { Language } from '@/lib/i18n';

interface MobileNavProps {
  lang: Language;
  translations: {
    inbox: string;
    outbox: string;
    newMessage: string;
    departments: string;
    menu: string;
  };
}

export default function MobileNav({ lang, translations }: MobileNavProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const navigateTo = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="md:hidden"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>{translations.menu}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 mt-6">
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12"
            onClick={() => navigateTo('/department/main')}
            data-testid="mobile-nav-departments"
          >
            <Home className="h-5 w-5" />
            <span className="text-base">{translations.departments}</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12"
            onClick={() => navigateTo('/department/inbox')}
            data-testid="mobile-nav-inbox"
          >
            <Inbox className="h-5 w-5" />
            <span className="text-base">{translations.inbox}</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12"
            onClick={() => navigateTo('/department/outbox')}
            data-testid="mobile-nav-outbox"
          >
            <Send className="h-5 w-5" />
            <span className="text-base">{translations.outbox}</span>
          </Button>
          <Button
            variant="default"
            className="justify-start gap-3 h-12 mt-4"
            onClick={() => navigateTo('/department/compose')}
            data-testid="mobile-nav-compose"
          >
            <PenSquare className="h-5 w-5" />
            <span className="text-base">{translations.newMessage}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
