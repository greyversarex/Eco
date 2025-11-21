import { Link } from "wouter";
import { Shield, Lock, Database, Eye, Mail, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-semibold text-lg">EcoDoc Platform</h1>
              <p className="text-xs text-muted-foreground">Низоми ҳифзи маълумот</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back-home">
              ← Бозгашт ба саҳифаи асосӣ
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <FileText className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Сиёсати Махфият
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Privacy Policy / Политика конфиденциальности
          </p>
          <p className="text-sm text-muted-foreground">
            Санаи охирин навсозӣ: 21 ноябри 2025
          </p>
        </div>

        {/* Alert Banner */}
        <Card className="p-4 mb-8 border-blue-200 bg-blue-50/50">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Ҳифзи маълумот – афзалияти мо
              </p>
              <p className="text-sm text-blue-700">
                EcoDoc платформаи ҳифзшудаи дохилии ташкилотӣ барои департаментҳои давлатии Тоҷикистон аст. 
                Тамоми маълумот дар дохили сервери Тоҷикистон нигоҳ дошта мешавад.
              </p>
            </div>
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1: Data Collection */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">1. Ҷамъоварии маълумот</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Маълумоте, ки мо ҷамъ мекунем:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Маълумоти ташкилотӣ:</strong> Номи департамент, рамзи дастрасӣ (кодҳои умумӣ барои департаментҳо)</li>
                    <li><strong>Маълумоти маъмурӣ:</strong> Номи корбар ва рамзи убур барои маъмурон</li>
                    <li><strong>Мундариҷаи паёмҳо:</strong> Матн, замимашудаҳо, санаҳои ирсол ва қабул</li>
                    <li><strong>Маълумоти супориш ва эълонҳо:</strong> Мавзӯъ, мундариҷа, муҳлат, иҷрокунандагон</li>
                    <li><strong>Маълумоти техникӣ:</strong> Cookies барои нигоҳдории сессия (30 рӯз), логҳои даромад</li>
                  </ul>
                  
                  <p className="font-medium text-foreground pt-2">Маълумоте, ки мо ҷамъ НАМЕКУНЕМ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Маълумоти шахсӣ (ном, насаб, рақами телефон, email-и шахсӣ)</li>
                    <li>Маълумоти геолокатсия</li>
                    <li>Маълумоти молиявӣ ё пардохтӣ</li>
                    <li>Маълумот аз дигар барномаҳо дар дастгоҳи шумо</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Data Usage */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">2. Истифодаи маълумот</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Маълумоти ҷамъоварӣ танҳо барои ҳадафҳои зерин истифода мешавад:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Иртиботи дохилӣ:</strong> Ирсол ва қабули паёмҳо байни департаментҳо</li>
                    <li><strong>Идораи супоришҳо:</strong> Таъин, пайгирӣ ва иҷрои вазифаҳо</li>
                    <li><strong>Эълонҳо:</strong> Огоҳкунии ҳамаи департаментҳо оид ба муҳтавои муҳим</li>
                    <li><strong>Аутентификатсия:</strong> Нигоҳдории сессияи корбар тавассути cookies (30 рӯз)</li>
                    <li><strong>Бойгонӣ:</strong> Нигоҳдории таърихи паёмҳо барои муроҷиа ва ҳисоботҳо</li>
                    <li><strong>Хабарномаҳои Push:</strong> Огоҳкунӣ оид ба паёмҳои нав (бо розигии корбар)</li>
                  </ul>
                  
                  <p className="pt-2 font-medium text-foreground">
                    Мо ҳеҷ гоҳ маълумоти шуморо барои маркетинг, таҳлил ё фурӯш ба тарафҳои сеюм истифода намекунем.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Data Storage & Security */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">3. Нигоҳдорӣ ва ҳифзи маълумот</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-2">Макони нигоҳдорӣ:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>База:</strong> PostgreSQL дар сервери ҳостинги Timeweb (Тоҷикистон)</li>
                      <li><strong>Файлҳо:</strong> Замимашудаҳо мустақиман дар базаи маълумот нигоҳ дошта мешаванд</li>
                      <li><strong>Резервӣ:</strong> Нусхабардории автоматикии рӯзона</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-medium text-foreground mb-2">Тадбирҳои амниятӣ:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Рамзгузорӣ HTTPS:</strong> Тамоми муносибатҳо тавассути протоколи HTTPS ҳифз мешаванд</li>
                      <li><strong>Хэшкунии рамзҳо:</strong> Рамзҳои убур тавассути алгоритми Bcrypt нигоҳ дошта мешаванд</li>
                      <li><strong>Сессияҳои ҳифзшуда:</strong> HttpOnly cookies + sameSite ҳимоя</li>
                      <li><strong>Дастрасии маҳдуд:</strong> Ҳар департамент танҳо ба паёмҳои худ дастрасӣ дорад</li>
                      <li><strong>Логҳои аудит:</strong> Пайгирии тамоми амалиётҳои муҳим</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-medium text-foreground mb-2">Муддати нигоҳдорӣ:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Паёмҳо: Номаҳдуд (то ҳангоми нест кардан аз ҷониби маъмур)</li>
                      <li>Супоришҳо ва эълонҳо: Номаҳдуд (то ҳангоми нест кардан)</li>
                      <li>Сессияҳо: 30 рӯз баъд аз охирин фаъолият автоматӣ нест мешаванд</li>
                      <li>Корзина: 30 рӯз, баъд аз он назди маъмурон барои несткунии доимӣ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Cookies */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">4. Истифодаи Cookies</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Мо cookies-ҳои зайлро истифода мебарем:</p>
                  
                  <div>
                    <p className="font-medium text-foreground mb-2">Cookies-ҳои зарурӣ:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>connect.sid:</strong> ID-и сессияи корбар (HttpOnly, Secure, 30 рӯз)</li>
                      <li>Барои кор кардани системаи аутентификатсия ҳатмӣ аст</li>
                      <li>Дар ҳолати HTTPS: sameSite=none (барои дастрасии PWA/Mobile)</li>
                      <li>Дар ҳолати HTTP: sameSite=lax (барои таҳияи маҳаллӣ)</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-medium text-foreground mb-2">Нигоҳдории маҳаллӣ (LocalStorage/IndexedDB):</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Лоиҳаҳо:</strong> Паёмҳои навишташуда то ҳангоми ирсол</li>
                      <li><strong>Кэш:</strong> Маълумоти департаментҳо барои кори офлайн</li>
                      <li><strong>Танзимот:</strong> Забон, интихоби режими торик/равшан (дар оянда)</li>
                    </ul>
                  </div>

                  <p className="pt-2 font-medium text-foreground">
                    Мо cookies-ҳои таҳлилӣ ё таблиғотӣ истифода намебарем.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: Third Party Services */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">5. Хидматҳои тарафи сеюм</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>EcoDoc танҳо аз хидматҳои зайл истифода мебарад:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Timeweb Hosting:</strong> Хостинги сервер ва базаи маълумот (Русия/СНГ)</li>
                    <li><strong>Google Fonts:</strong> Боргирии фонтҳо (Inter, Roboto) барои дастгирии забонҳои кириллӣ</li>
                    <li><strong>Web Push API:</strong> Хабарномаҳои браузерӣ (бо розигии корбар)</li>
                  </ul>
                  
                  <p className="pt-2 font-medium text-foreground">
                    Мо маълумотро ба дигар платформаҳои иҷтимоӣ, хизматҳои таҳлилӣ (Google Analytics) 
                    ё шабакаҳои таблиғотӣ интиқол намедиҳем.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 6: User Rights */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">6. Ҳуқуқҳои корбар</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Шумо ҳуқуқҳои зеринро доред:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Дастрасӣ:</strong> Дидани тамоми маълумоте, ки дар системаи EcoDoc нигоҳ дошта шудааст</li>
                    <li><strong>Тасҳеҳ:</strong> Дархости тағйири маълумоти нодуруст</li>
                    <li><strong>Несткунӣ:</strong> Нест кардани паёмҳо ба корзина (30 рӯз нигоҳдорӣ)</li>
                    <li><strong>Экспорт:</strong> Маъмурон метавонанд архиви ZIP-и паёмҳоро боргирӣ кунанд</li>
                    <li><strong>Хуруҷ:</strong> Баромад аз система ва несткунии сессия дар ҳар вақт</li>
                  </ul>
                  
                  <p className="pt-2 font-medium text-foreground">
                    Барои истифода аз ҳуқуқҳои худ, бо маъмури системаи EcoDoc дар ташкилоти шумо тамос гиред.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 7: Children's Privacy */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">7. Махфияти кӯдакон</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    EcoDoc платформаи ташкилотии дохилӣ аст, ки барои кормандони расмии департаментҳои 
                    давлатӣ ва ташкилотӣ дар назар дошта шудааст. Ин платформа барои истифодаи кӯдакони 
                    зери 18 сола пешбинӣ нашудааст.
                  </p>
                  <p className="font-medium text-foreground">
                    Мо огоҳона маълумоти кӯдаконро ҷамъ намекунем.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 8: Changes to Policy */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">8. Тағйироти сиёсати махфият</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Мо метавонем ин сиёсати махфиятро вақт ба вақт навсозӣ кунем. Ҳар гуна тағйироти 
                    муҳим дар ин саҳифа эълон карда мешавад. Санаи "Санаи охирин навсозӣ" дар болои 
                    саҳифа нишон медиҳад, ки сиёсат охирин маротиба кай тағйир ёфтааст.
                  </p>
                  <p className="font-medium text-foreground">
                    Мо тавсия медиҳем, ки шумо ин сиёсатро мунтазам аз назар гузаронед.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 9: Contact */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">9. Тамос</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Агар дар бораи ин сиёсати махфият ё амалкунии мо бо маълумоти шумо саволҳо дошта бошед, 
                    лутфан бо маъмури системаи EcoDoc дар ташкилоти худ тамос гиред.
                  </p>
                  
                  <div className="pt-2 bg-gray-50 p-4 rounded-lg border">
                    <p className="font-medium text-foreground mb-2">Маълумоти платформа:</p>
                    <ul className="space-y-1">
                      <li><strong>Номи платформа:</strong> EcoDoc Platform</li>
                      <li><strong>Мақсад:</strong> Системаи ҳуҷҷатгардонӣ ва паёмрасонии дохилии департаментҳои давлатӣ</li>
                      <li><strong>Тип:</strong> Барномаи веб (PWA) + барномаҳои мобилии iOS/Android</li>
                      <li><strong>Версия:</strong> 1.0.0</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Ин сиёсати махфият охирин маротиба дар 21 ноябри 2025 навсозӣ шудааст.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="default" data-testid="button-back-login">
                Бозгашт ба саҳифаи воридшавӣ
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            © 2025 EcoDoc Platform. Ҳамаи ҳуқуқҳо ҳифз шудаанд.
          </p>
        </div>
      </main>
    </div>
  );
}
