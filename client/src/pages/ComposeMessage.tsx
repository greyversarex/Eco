import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Upload, X, Leaf } from 'lucide-react';

// todo: remove mock functionality
const mockDepartments = [
  { id: '1', name: 'Раёсати Душанбе' },
  { id: '2', name: 'Агентии обухаводонимоси' },
  { id: '3', name: 'Сарраёсати Вилоҷи Суғд' },
  { id: '4', name: 'Сарраёсати ВМКБ' },
];

export default function ComposeMessage() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [recipient, setRecipient] = useState('');
  const [executor, setExecutor] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const t = useTranslation(lang);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      console.log('File attached:', e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending message:', { subject, date, recipient, executor, content, file });
    setLocation('/department/outbox');
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
                  <h1 className="text-lg font-semibold text-foreground">{t.newMessage}</h1>
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
          <CardHeader>
            <CardTitle>{t.newMessage}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    {t.subject} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.enterSubject}
                    required
                    data-testid="input-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    {t.date} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    data-testid="input-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">
                  {t.recipient} <span className="text-destructive">*</span>
                </Label>
                <Select value={recipient} onValueChange={setRecipient} required>
                  <SelectTrigger id="recipient" data-testid="select-recipient">
                    <SelectValue placeholder={t.selectRecipient} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executor">{t.executorOptional}</Label>
                <Input
                  id="executor"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                  placeholder={lang === 'tg' ? 'Исм ва насаби иҷрокунанда' : 'ФИО исполнителя'}
                  data-testid="input-executor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {t.content} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.enterContent}
                  rows={8}
                  required
                  data-testid="textarea-content"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.attachFile}</Label>
                {!file ? (
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      data-testid="input-file"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center hover-elevate"
                    >
                      <div className="space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{t.dragDropFile}</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
                    <span className="flex-1 text-sm font-medium text-foreground">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" data-testid="button-send">
                  {t.send}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/department/main')}
                  data-testid="button-cancel"
                >
                  {t.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
