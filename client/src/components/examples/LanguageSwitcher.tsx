import { useState } from 'react';
import LanguageSwitcher from '../LanguageSwitcher';
import type { Language } from '@/lib/i18n';

export default function LanguageSwitcherExample() {
  const [lang, setLang] = useState<Language>('tg');
  
  return (
    <div className="p-4">
      <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
    </div>
  );
}
