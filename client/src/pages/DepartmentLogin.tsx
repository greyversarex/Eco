import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation, type Language } from '@/lib/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import bgImage from '@assets/eco-bg-wide.png';
import bgMobileImage from '@assets/eco-mobile-bg.png';
import logoImage from '@assets/logo-optimized.webp';

export default function DepartmentLogin() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [code, setCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslation(lang);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (accessCode: string) => {
      return await apiRequest('POST', '/api/auth/department/login', { accessCode });
    },
    onSuccess: async (data: any) => {
      setIsSuccess(true);
      // Clear all cache and force fresh fetch
      queryClient.clear();
      // Then invalidate auth to force refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      await new Promise(resolve => setTimeout(resolve, 200));
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
    if (code && !loginMutation.isPending && !isSuccess) {
      loginMutation.mutate(code);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ 
        backgroundImage: `url(${bgMobileImage})`
      }}
    >
      <div 
        className="absolute inset-0 hidden md:block bg-cover bg-center" 
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center'
        }}
      />
      
      <div className="absolute top-8 left-4 z-20">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setLocation('/monitoring')}
          className="bg-white/90 hover:bg-white border-2 border-primary text-primary hover:text-primary font-semibold shadow-lg"
          data-testid="button-monitoring"
        >
          {t.monitoring}
        </Button>
      </div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center -mt-16 md:ml-12">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="ЭкоТоҷикистон лого" className="h-20 w-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-white md:drop-shadow-lg">ЭкоТоҷикистон</h1>
          <p className="text-sm text-muted-foreground md:text-white/95 md:drop-shadow-md">Портали рақамии Кумитаи ҳифзи муҳити зист</p>
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
                  disabled={loginMutation.isPending || isSuccess}
                  data-testid="input-code"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {(loginMutation.isPending || isSuccess) ? (lang === 'tg' ? 'Лутфан интизор шавед...' : 'Пожалуйста, подождите...') : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
