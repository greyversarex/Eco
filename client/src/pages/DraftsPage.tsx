import { DraftsPanel } from '@/components/drafts-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineIndicator } from '@/components/offline-indicator';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function DraftsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/department/main">
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-600" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Черновики</h1>
              <p className="text-sm text-green-50">Сообщения для отправки офлайн</p>
            </div>
            <OfflineIndicator />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Как работают черновики?</CardTitle>
            <CardDescription>
              Черновики позволяют создавать сообщения даже без интернета
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">1.</div>
              <div>
                При создании сообщения <strong>офлайн</strong> нажмите кнопку 
                "Сохранить черновик"
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">2.</div>
              <div>
                Черновик сохранится в устройстве и будет доступен здесь
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">3.</div>
              <div>
                При восстановлении связи все черновики <strong>автоматически</strong> отправятся
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">4.</div>
              <div>
                Можно также отправить черновики вручную, нажав кнопку "Отправить"
              </div>
            </div>
          </CardContent>
        </Card>

          <DraftsPanel />
        </div>
      </main>
    </div>
  );
}
