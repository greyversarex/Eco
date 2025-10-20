import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import bgImage from '@assets/Lifestyle-Adopt-Sustainable-Living-Practices_1760999883971.jpg';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const t = useTranslation(lang);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: () => {
      setLocation('/admin/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message || (lang === 'tg' ? 'Логин ё парол нодуруст аст' : 'Неверный логин или пароль'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      loginMutation.mutate({ username, password });
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex justify-end">
          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white drop-shadow-lg">{t.adminPanel}</h1>
          <p className="text-sm text-white/90 drop-shadow-md">ЭкоТочикистон</p>
        </div>

        <Card className="shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">{t.adminLogin}</CardTitle>
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
                  disabled={loginMutation.isPending}
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
                  disabled={loginMutation.isPending}
                  data-testid="input-password"
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
        
        <div className="text-center">
          <a 
            href="/" 
            className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md font-medium"
            data-testid="link-department"
          >
            {lang === 'tg' ? 'Воридшавии шуъба' : 'Вход для отдела'}
          </a>
        </div>
      </div>
    </div>
  );
}
