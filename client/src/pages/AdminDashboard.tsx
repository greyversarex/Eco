import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { Building2, Mail, LogOut, Plus, Pencil, Trash2, RefreshCw, Copy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';

export default function AdminDashboard() {
  const [lang, setLang] = useState<Language>('tg');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBlock, setNewDeptBlock] = useState('');
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptBlock, setEditDeptBlock] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const t = useTranslation(lang);
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; block: string }) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      return await apiRequest('POST', '/api/departments', { ...data, accessCode: code });
    },
    onSuccess: (newDept) => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setNewDeptName('');
      setNewDeptBlock('');
      setIsAddDialogOpen(false);
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: `${lang === 'tg' ? 'Шуъба илова шуд. Рамз' : 'Отдел добавлен. Код'}: ${newDept.accessCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Department> }) => {
      return await apiRequest('PATCH', `/api/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Шуъба навсозӣ шуд' : 'Отдел обновлен',
      });
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/departments/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Шуъба нест карда шуд' : 'Отдел удален',
      });
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddDepartment = () => {
    if (newDeptName && newDeptBlock) {
      createMutation.mutate({ name: newDeptName, block: newDeptBlock });
    }
  };

  const handleDeleteDepartment = (id: number) => {
    if (confirm(lang === 'tg' ? 'Шумо мутмаин ҳастед?' : 'Вы уверены?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateCode = (id: number) => {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    updateMutation.mutate({ id, data: { accessCode: newCode } });
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptBlock(dept.block);
    setEditDeptCode(dept.accessCode);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingDept && editDeptName && editDeptBlock && editDeptCode) {
      updateMutation.mutate({ 
        id: editingDept.id, 
        data: { 
          name: editDeptName, 
          block: editDeptBlock, 
          accessCode: editDeptCode 
        } 
      });
      setIsEditDialogOpen(false);
      setEditingDept(null);
      setEditDeptName('');
      setEditDeptBlock('');
      setEditDeptCode('');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: lang === 'tg' ? 'Нусхабардорӣ шуд' : 'Скопировано',
      description: lang === 'tg' ? 'Рамз нусхабардорӣ шуд' : 'Код скопирован',
    });
  };

  const getBlockLabel = (block: string) => {
    if (block === 'upper') return t.upperBlock;
    if (block === 'middle') return t.middleBlock;
    return t.lowerBlock;
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ 
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div 
        className="absolute inset-0" 
        style={{
          background: 'rgba(255, 255, 255, 0.92)'
        }}
      />
      <header 
        className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-md relative"
        style={{
          background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
        }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{t.adminPanel}</h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">ЭкоТоҷикистон</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin/departments'}
                data-testid="button-departments"
                className="gap-2 hidden sm:flex text-white hover:bg-white/20"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden md:inline">{lang === 'tg' ? 'Паёмҳо' : 'Сообщения'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin/departments'}
                data-testid="button-departments-mobile"
                className="sm:hidden text-white hover:bg-white/20"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.departments}</p>
                <p className="text-2xl font-semibold text-foreground">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.totalMessages}</p>
                <p className="text-2xl font-semibold text-foreground">-</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t.departments}</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-department" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="sm:inline">{t.addDepartment}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addDepartment}</DialogTitle>
                  <DialogDescription>
                    {lang === 'tg' ? 'Шуъбаи навро илова кунед' : 'Добавить новый отдел'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">{t.departmentName}</Label>
                    <Input
                      id="dept-name"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      data-testid="input-dept-name"
                      placeholder={lang === 'tg' ? 'Номи шуъбаро ворид кунед' : 'Введите название отдела'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-block">{t.block}</Label>
                    <Select value={newDeptBlock} onValueChange={setNewDeptBlock}>
                      <SelectTrigger id="dept-block" data-testid="select-dept-block">
                        <SelectValue placeholder={lang === 'tg' ? 'Блокро интихоб кунед' : 'Выберите блок'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">{t.upperBlock}</SelectItem>
                        <SelectItem value="middle">{t.middleBlock}</SelectItem>
                        <SelectItem value="lower">{t.lowerBlock}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddDepartment} 
                    className="w-full" 
                    data-testid="button-save-department"
                    disabled={createMutation.isPending || !newDeptName || !newDeptBlock}
                  >
                    {createMutation.isPending ? (lang === 'tg' ? 'Лутфан интизор шавед...' : 'Пожалуйста, подождите...') : t.addDepartment}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lang === 'tg' ? 'Таҳрир кардани шуъба' : 'Редактировать отдел'}</DialogTitle>
                  <DialogDescription>
                    {lang === 'tg' ? 'Маълумоти шуъбаро тағйир диҳед' : 'Изменить информацию об отделе'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-name">{t.departmentName}</Label>
                    <Input
                      id="edit-dept-name"
                      value={editDeptName}
                      onChange={(e) => setEditDeptName(e.target.value)}
                      data-testid="input-edit-dept-name"
                      placeholder={lang === 'tg' ? 'Номи шуъбаро ворид кунед' : 'Введите название отдела'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-block">{t.block}</Label>
                    <Select value={editDeptBlock} onValueChange={setEditDeptBlock}>
                      <SelectTrigger id="edit-dept-block" data-testid="select-edit-dept-block">
                        <SelectValue placeholder={lang === 'tg' ? 'Блокро интихоб кунед' : 'Выберите блок'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">{t.upperBlock}</SelectItem>
                        <SelectItem value="middle">{t.middleBlock}</SelectItem>
                        <SelectItem value="lower">{t.lowerBlock}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-code">{t.accessCode}</Label>
                    <Input
                      id="edit-dept-code"
                      value={editDeptCode}
                      onChange={(e) => setEditDeptCode(e.target.value.toUpperCase())}
                      data-testid="input-edit-dept-code"
                      placeholder={lang === 'tg' ? 'Рамзи воридшавиро ворид кунед' : 'Введите код доступа'}
                      className="font-mono"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveEdit} 
                    className="w-full" 
                    data-testid="button-save-edit-department"
                    disabled={updateMutation.isPending || !editDeptName || !editDeptBlock || !editDeptCode}
                  >
                    {updateMutation.isPending ? (lang === 'tg' ? 'Лутфан интизор шавед...' : 'Пожалуйста, подождите...') : (lang === 'tg' ? 'Захира кардан' : 'Сохранить')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
              </div>
            </div>
          ) : departments.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{lang === 'tg' ? 'Ҳоло шуъбае нест' : 'Пока нет отделов'}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">{t.departmentName}</TableHead>
                      <TableHead className="min-w-[120px]">{t.block}</TableHead>
                      <TableHead className="min-w-[160px]">{t.accessCode}</TableHead>
                      <TableHead className="text-right min-w-[120px]">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{getBlockLabel(dept.block)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 text-sm font-mono whitespace-nowrap">
                              {dept.accessCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(dept.accessCode)}
                              data-testid={`button-copy-${dept.id}`}
                              className="shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDepartment(dept)}
                              data-testid={`button-edit-${dept.id}`}
                              className="shrink-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateCode(dept.id)}
                              data-testid={`button-generate-${dept.id}`}
                              disabled={updateMutation.isPending}
                              className="shrink-0"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDepartment(dept.id)}
                              data-testid={`button-delete-${dept.id}`}
                              disabled={deleteMutation.isPending}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
