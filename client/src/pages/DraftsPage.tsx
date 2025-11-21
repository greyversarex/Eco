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
              <h1 className="text-2xl font-bold">Лоиҳаҳо</h1>
              <p className="text-sm text-green-50">Паёмҳо барои фиристодан офлайн</p>
            </div>
            <OfflineIndicator />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Лоиҳаҳо чӣ тавр кор мекунанд?</CardTitle>
            <CardDescription>
              Лоиҳаҳо имкон медиҳанд паёмҳоро ҳатто бе интернет эҷод кунед
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">1.</div>
              <div>
                Ҳангоми эҷоди паём <strong>офлайн</strong> тугмаи сабзро (нигоҳдории лоиҳа) пахш кунед
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">2.</div>
              <div>
                Лоиҳа дар дастгоҳ нигоҳ дошта мешавад ва дар ин ҷо дастрас хоҳад буд
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">3.</div>
              <div>
                Ҳангоми барқарорӣ алоқа ҳамаи лоиҳаҳо <strong>худкор</strong> фиристода мешаванд
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-medium min-w-[40px]">4.</div>
              <div>
                Инчунин метавонед лоиҳаҳоро бо даст фиристед, тугмаи "Фиристодан"-ро пахш карда
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
