import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf } from 'lucide-react';

// todo: remove mock functionality
const mockMessage = {
  id: '1',
  subject: 'Дар бораи лоиҳаи нави экологӣ',
  sender: 'Раёсати Душанбе',
  recipient: 'Агентии обухаводонимоси',
  date: '20.10.2025',
  executor: 'Иброҳимов А.С.',
  content: `Ҳурматманд ҳамкорон,

Бо ин васила ба иттилои шумо мерасонем, ки лоиҳаи нави экологӣ барои соли 2025 омода шудааст. 

Лутфан ҳуҷҷатҳои замимашударо баррасӣ кунед ва пешниҳодҳои худро то 25.10.2025 ирсол намоед.

Бо эҳтиром,
Иброҳимов А.С.
Раёсати Душанбе`,
  hasAttachment: true,
  attachmentName: 'loiha_ekologi_2025.pdf',
};

export default function MessageView() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);

  const handleReply = () => {
    console.log('Replying to message');
    setLocation('/department/compose?replyTo=1');
  };

  const handleDownload = () => {
    console.log('Downloading attachment');
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
                onClick={() => setLocation('/department/inbox')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{mockMessage.subject}</h1>
                  <p className="text-xs text-muted-foreground">ЭкоТочикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">{mockMessage.subject}</h2>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">{t.sender}:</span> {mockMessage.sender}
                  </p>
                  <p>
                    <span className="font-medium">{t.date}:</span> {mockMessage.date}
                  </p>
                  <p>
                    <span className="font-medium">{t.executor}:</span> {mockMessage.executor}
                  </p>
                </div>
              </div>
              <Button onClick={handleReply} data-testid="button-reply" className="gap-2">
                <Reply className="h-4 w-4" />
                {t.reply}
              </Button>
            </div>

            {mockMessage.hasAttachment && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {mockMessage.attachmentName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t.download}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {mockMessage.content}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
