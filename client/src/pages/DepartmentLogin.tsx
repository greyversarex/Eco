import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { Leaf } from 'lucide-react';

export default function DepartmentLogin() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [code, setCode] = useState('');
  const t = useTranslation(lang);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Department login with code:', code);
    // todo: remove mock functionality
    if (code) {
      setLocation('/department/main');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">ЭкоТочикистон</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'tg' 
              ? 'Платформаи дохилии мубодилаи ҳуҷҷатҳо ва хатҳо' 
              : 'Внутренняя платформа обмена документами и сообщениями'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.loginTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t.departmentCode}</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder={t.enterCode}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  data-testid="input-code"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit">
                {t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <a 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-admin"
          >
            {t.adminLogin}
          </a>
        </div>
      </div>
    </div>
  );
}
