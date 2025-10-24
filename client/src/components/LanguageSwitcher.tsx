import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-white/30 bg-white/10 p-0.5" data-testid="language-switcher">
      <Button
        size="sm"
        variant={currentLang === 'tg' ? 'default' : 'ghost'}
        className="h-7 px-2.5 text-xs font-medium text-white hover:bg-white/20"
        onClick={() => onLanguageChange('tg')}
        data-testid="button-lang-tg"
      >
        ТҶ
      </Button>
      <Button
        size="sm"
        variant={currentLang === 'ru' ? 'default' : 'ghost'}
        className="h-7 px-2.5 text-xs font-medium text-white hover:bg-white/20"
        onClick={() => onLanguageChange('ru')}
        data-testid="button-lang-ru"
      >
        RU
      </Button>
    </div>
  );
}
