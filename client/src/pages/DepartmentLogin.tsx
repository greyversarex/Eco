import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { Leaf } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import bgImage from '@assets/photo_extend_40_reflect_2867x1358_1761066978062.jpg';

export default function DepartmentLogin() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();
  const t = useTranslation(lang);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (accessCode: string) => {
      return await apiRequest('POST', '/api/auth/department/login', { accessCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation('/department/main');
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message || (lang === 'tg' ? 'Рамзи дастрасӣ нодуруст аст' : 'Неверный код доступа'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      loginMutation.mutate(code);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ 
        background: 'linear-gradient(135deg, #8fbc8f 0%, #90c695 50%, #a8d5ba 100%)'
      }}
    >
      <div 
        className="absolute inset-0 hidden md:block bg-cover bg-center" 
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center'
        }}
      />
      
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
      </div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center -mt-16">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Leaf className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-white md:drop-shadow-lg">ЭкоТочикистон</h1>
          <p className="text-sm text-muted-foreground md:text-white/95 md:drop-shadow-md">
            {lang === 'tg' 
              ? 'Платформаи дохилии мубодилаи ҳуҷҷатҳо ва хатҳо' 
              : 'Внутренняя платформа обмена документами и сообщениями'}
          </p>
        </div>

        <Card className="w-full shadow-2xl border-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}>
          <CardHeader>
            <CardTitle className="text-xl text-center">{t.loginTitle}</CardTitle>
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
                  disabled={loginMutation.isPending}
                  data-testid="input-code"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? (lang === 'tg' ? 'Лутфан интизор шавед...' : 'Пожалуйста, подождите...') : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-foreground md:text-white/95 md:hover:text-white transition-colors md:drop-shadow-md font-medium"
            data-testid="link-admin"
          >
            {t.adminLogin}
          </a>
        </div>
      </div>
    </div>
  );
}
