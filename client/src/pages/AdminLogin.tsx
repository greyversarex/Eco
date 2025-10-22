import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import bgImage from '@assets/eco-bg-wide.png';
import logoImage from '@assets/logo-optimized.webp';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslation(lang);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest('POST', '/api/auth/admin/login', credentials);
    },
    onSuccess: async (data: any) => {
      setIsSuccess(true);
      // Clear all cache and force fresh fetch
      queryClient.clear();
      // Then invalidate auth to force refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      await new Promise(resolve => setTimeout(resolve, 200));
      setLocation('/admin/dashboard');
    },
    onError: (error) => {
      const err = error as Error;
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: err.message || (lang === 'tg' ? 'Логин ё парол нодуруст аст' : 'Неверный логин или пароль'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password && !loginMutation.isPending && !isSuccess) {
      loginMutation.mutate({ username, password });
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
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center -mt-16 md:ml-12">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="ЭкоТочикистон лого" className="h-20 w-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-white md:drop-shadow-lg">{t.adminPanel}</h1>
          <p className="text-sm text-muted-foreground md:text-white/95 md:drop-shadow-md">ЭкоТочикистон</p>
        </div>

        <Card className="w-full shadow-2xl border-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}>
          <CardHeader>
            <CardTitle className="text-xl text-center">{t.adminLogin}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t.username}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t.enterUsername}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loginMutation.isPending || isSuccess}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.enterPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginMutation.isPending || isSuccess}
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending || isSuccess}
                data-testid="button-submit"
              >
                {(loginMutation.isPending || isSuccess) ? (lang === 'tg' ? 'Лутфан интизор шавед...' : 'Пожалуйста, подождите...') : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground md:text-white/95 md:hover:text-white transition-colors md:drop-shadow-md font-medium"
            data-testid="link-department"
          >
            {t.departmentLogin}
          </a>
        </div>
      </div>
    </div>
  );
}
