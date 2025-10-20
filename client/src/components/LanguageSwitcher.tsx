import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1" data-testid="language-switcher">
      <Button
        size="sm"
        variant={currentLang === 'tg' ? 'default' : 'ghost'}
        className="h-8 px-3 text-sm font-medium"
        onClick={() => onLanguageChange('tg')}
        data-testid="button-lang-tg"
      >
        ТҶ
      </Button>
      <Button
        size="sm"
        variant={currentLang === 'ru' ? 'default' : 'ghost'}
        className="h-8 px-3 text-sm font-medium"
        onClick={() => onLanguageChange('ru')}
        data-testid="button-lang-ru"
      >
        RU
      </Button>
    </div>
  );
}
