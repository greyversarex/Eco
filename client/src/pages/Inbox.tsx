import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MessageListItem from '@/components/MessageListItem';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Leaf } from 'lucide-react';

// todo: remove mock functionality
const mockMessages = [
  {
    id: '1',
    subject: 'Дар бораи лоиҳаи нави экологӣ',
    sender: 'Раёсати Душанбе',
    date: '20.10.2025',
    isRead: false,
    hasAttachment: true,
  },
  {
    id: '2',
    subject: 'Ҳисобот оиди фаъолияти моҳ',
    sender: 'Агентии обухаводонимоси',
    date: '19.10.2025',
    isRead: true,
    hasAttachment: false,
  },
  {
    id: '3',
    subject: 'Дастури иҷрои чораҳои экологӣ',
    sender: 'Сарраёсати Вилоҷи Суғд',
    date: '18.10.2025',
    isRead: false,
    hasAttachment: true,
  },
  {
    id: '4',
    subject: 'Маълумот дар бораи назорати сифат',
    sender: 'Раёсати мониторинги сифати экологӣ',
    date: '17.10.2025',
    isRead: true,
    hasAttachment: false,
  },
];

export default function Inbox() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);

  const handleMessageClick = (messageId: string) => {
    console.log('Opening message:', messageId);
    setLocation(`/department/message/${messageId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/department/main')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{t.inbox}</h1>
                  <p className="text-xs text-muted-foreground">ЭкоТочикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl">
        <div className="border-x border-border bg-background min-h-screen">
          {mockMessages.map((message) => (
            <MessageListItem
              key={message.id}
              {...message}
              onClick={() => handleMessageClick(message.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
