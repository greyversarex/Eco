import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import bgImage from '@assets/eco-bg-wide.webp';
import bgMobileImage from '@assets/eco-mobile-bg.webp';
import logoImage from '@assets/logo-optimized.webp';

export default function DepartmentLogin() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (accessCode: string) => {
      return await apiRequest('POST', '/api/auth/department/login', { accessCode });
    },
    onSuccess: async (data: any) => {
      setIsSuccess(true);
      // Clear all cache except auth
      queryClient.clear();
      
      // Retry fetching auth data with exponential backoff
      // This handles race conditions when session isn't fully persisted yet
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const result = await queryClient.fetchQuery({ 
            queryKey: ['/api/auth/me'],
            staleTime: 0,
          });
          if (result) {
            break; // Success, exit retry loop
          }
        } catch (e) {
          attempts++;
          if (attempts < maxAttempts) {
            // Wait before retrying (100ms, 200ms, 400ms)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts - 1)));
          }
        }
      }
      
      setLocation('/department/main');
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Рамзи дастрасӣ нодуруст аст',
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
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center -mt-16 md:ml-12">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="EcoDoc лого" className="h-20 w-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-white md:drop-shadow-lg">EcoDoc</h1>
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
                {(loginMutation.isPending || isSuccess) ? 'Лутфан интизор шавед...' : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
