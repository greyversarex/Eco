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
import { Checkbox } from '@/components/ui/checkbox';
import { t } from '@/lib/i18n';
import { Building2, Mail, LogOut, Plus, Pencil, Trash2, RefreshCw, Copy, Search, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBlock, setNewDeptBlock] = useState('');
  const [newCanMonitor, setNewCanMonitor] = useState(false);
  const [newCanCreateAssignmentFromMessage, setNewCanCreateAssignmentFromMessage] = useState(false);
  const [newCanCreateAssignment, setNewCanCreateAssignment] = useState(false);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptBlock, setEditDeptBlock] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editCanMonitor, setEditCanMonitor] = useState(false);
  const [editCanCreateAssignmentFromMessage, setEditCanCreateAssignmentFromMessage] = useState(false);
  const [editCanCreateAssignment, setEditCanCreateAssignment] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allDepartments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Filter and sort departments by search query
  const departments = allDepartments
    .filter((dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by block first (upper → middle → lower → district)
      const blockOrder = { upper: 0, middle: 1, lower: 2, district: 3 };
      const blockDiff = blockOrder[a.block as keyof typeof blockOrder] - blockOrder[b.block as keyof typeof blockOrder];
      if (blockDiff !== 0) return blockDiff;
      
      // Then sort by name within same block
      return a.name.localeCompare(b.name, 'tg');
    });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; block: string; canMonitor: boolean; canCreateAssignmentFromMessage: boolean; canCreateAssignment: boolean }) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      return await apiRequest('POST', '/api/departments', { ...data, accessCode: code });
    },
    onSuccess: (newDept) => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setNewDeptName('');
      setNewDeptBlock('');
      setNewCanMonitor(false);
      setNewCanCreateAssignmentFromMessage(false);
      setNewCanCreateAssignment(false);
      setIsAddDialogOpen(false);
      toast({
        title: 'Муваффақият',
        description: `Шуъба илова шуд. Рамз: ${newDept.accessCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
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
        title: 'Муваффақият',
        description: 'Шуъба навсозӣ шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
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
        title: 'Муваффақият',
        description: 'Шуъба бекор карда шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddDepartment = () => {
    if (newDeptName && newDeptBlock) {
      createMutation.mutate({ 
        name: newDeptName, 
        block: newDeptBlock,
        canMonitor: newCanMonitor,
        canCreateAssignmentFromMessage: newCanCreateAssignmentFromMessage,
        canCreateAssignment: newCanCreateAssignment,
      });
    }
  };

  const handleDeleteDepartment = (id: number) => {
    if (confirm('Шумо мутмаин ҳастед?')) {
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
    setEditCanMonitor(dept.canMonitor);
    setEditCanCreateAssignmentFromMessage(dept.canCreateAssignmentFromMessage);
    setEditCanCreateAssignment(dept.canCreateAssignment);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingDept && editDeptName && editDeptBlock && editDeptCode) {
      updateMutation.mutate({ 
        id: editingDept.id, 
        data: { 
          name: editDeptName, 
          block: editDeptBlock, 
          accessCode: editDeptCode,
          canMonitor: editCanMonitor,
          canCreateAssignmentFromMessage: editCanCreateAssignmentFromMessage,
          canCreateAssignment: editCanCreateAssignment,
        } 
      });
      setIsEditDialogOpen(false);
      setEditingDept(null);
      setEditDeptName('');
      setEditDeptBlock('');
      setEditDeptCode('');
      setEditCanMonitor(false);
      setEditCanCreateAssignmentFromMessage(false);
      setEditCanCreateAssignment(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Нусхабардорӣ шуд',
      description: 'Рамз нусхабардорӣ шуд',
    });
  };

  const getBlockLabel = (block: string) => {
    if (block === 'upper') return t.upperBlock;
    if (block === 'middle') return t.middleBlock;
    if (block === 'district') return t.districtBlock;
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
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1 pt-2">
              <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{t.adminPanel}</h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">Портали электронӣ</p>
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
                <span className="hidden md:inline">Паёмҳо</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin/people'}
                data-testid="button-people"
                className="gap-2 hidden sm:flex text-white hover:bg-white/20"
              >
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Иҷрокунандагон</span>
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
              <Button
                size="sm"
                onClick={logout}
                data-testid="button-logout"
                className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white border-0 font-medium shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Баромад</span>
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
                <p className="text-2xl font-semibold text-foreground">{allDepartments.length}</p>
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
          {/* Поисковик */}
          <div className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ҷустуҷӯ"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-muted-foreground/20 focus:border-primary"
                data-testid="input-search"
              />
            </div>
          </div>

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
                    Шуъбаи навро илова кунед
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
                      placeholder="Номи шуъбаро ворид кунед"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-block">{t.block}</Label>
                    <Select value={newDeptBlock} onValueChange={setNewDeptBlock}>
                      <SelectTrigger id="dept-block" data-testid="select-dept-block">
                        <SelectValue placeholder="Блокро интихоб кунед" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">{t.upperBlock}</SelectItem>
                        <SelectItem value="middle">{t.middleBlock}</SelectItem>
                        <SelectItem value="lower">{t.lowerBlock}</SelectItem>
                        <SelectItem value="district">{t.districtBlock}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-base font-semibold">Салоҳиятҳо</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-can-monitor"
                        checked={newCanMonitor}
                        onCheckedChange={(checked) => setNewCanMonitor(checked as boolean)}
                        data-testid="checkbox-new-can-monitor"
                      />
                      <label htmlFor="new-can-monitor" className="text-sm cursor-pointer">
                        Назорат (кнопка мониторинг)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-can-create-assignment-from-message"
                        checked={newCanCreateAssignmentFromMessage}
                        onCheckedChange={(checked) => setNewCanCreateAssignmentFromMessage(checked as boolean)}
                        data-testid="checkbox-new-can-create-assignment-from-message"
                      />
                      <label htmlFor="new-can-create-assignment-from-message" className="text-sm cursor-pointer">
                        Вазифагузорӣ (эҷоди супориш аз паём)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-can-create-assignment"
                        checked={newCanCreateAssignment}
                        onCheckedChange={(checked) => setNewCanCreateAssignment(checked as boolean)}
                        data-testid="checkbox-new-can-create-assignment"
                      />
                      <label htmlFor="new-can-create-assignment" className="text-sm cursor-pointer">
                        Супоришҳо (эҷоди супориш дар саҳифаи супоришҳо)
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddDepartment} 
                    className="w-full" 
                    data-testid="button-save-department"
                    disabled={createMutation.isPending || !newDeptName || !newDeptBlock}
                  >
                    {createMutation.isPending ? 'Лутфан интизор шавед...' : t.addDepartment}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Таҳрир кардани шуъба</DialogTitle>
                  <DialogDescription>
                    Маълумоти шуъбаро тағйир диҳед
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
                      placeholder="Номи шуъбаро ворид кунед"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-block">{t.block}</Label>
                    <Select value={editDeptBlock} onValueChange={setEditDeptBlock}>
                      <SelectTrigger id="edit-dept-block" data-testid="select-edit-dept-block">
                        <SelectValue placeholder="Блокро интихоб кунед" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">{t.upperBlock}</SelectItem>
                        <SelectItem value="middle">{t.middleBlock}</SelectItem>
                        <SelectItem value="lower">{t.lowerBlock}</SelectItem>
                        <SelectItem value="district">{t.districtBlock}</SelectItem>
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
                      placeholder="Рамзи воридшавиро ворид кунед"
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-base font-semibold">Салоҳиятҳо</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-can-monitor"
                        checked={editCanMonitor}
                        onCheckedChange={(checked) => setEditCanMonitor(checked as boolean)}
                        data-testid="checkbox-edit-can-monitor"
                      />
                      <label htmlFor="edit-can-monitor" className="text-sm cursor-pointer">
                        Назорат (кнопка мониторинг)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-can-create-assignment-from-message"
                        checked={editCanCreateAssignmentFromMessage}
                        onCheckedChange={(checked) => setEditCanCreateAssignmentFromMessage(checked as boolean)}
                        data-testid="checkbox-edit-can-create-assignment-from-message"
                      />
                      <label htmlFor="edit-can-create-assignment-from-message" className="text-sm cursor-pointer">
                        Вазифагузорӣ (эҷоди супориш аз паём)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-can-create-assignment"
                        checked={editCanCreateAssignment}
                        onCheckedChange={(checked) => setEditCanCreateAssignment(checked as boolean)}
                        data-testid="checkbox-edit-can-create-assignment"
                      />
                      <label htmlFor="edit-can-create-assignment" className="text-sm cursor-pointer">
                        Супоришҳо (эҷоди супориш дар саҳифаи супоришҳо)
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveEdit} 
                    className="w-full" 
                    data-testid="button-save-edit-department"
                    disabled={updateMutation.isPending || !editDeptName || !editDeptBlock || !editDeptCode}
                  >
                    {updateMutation.isPending ? 'Лутфан интизор шавед...' : 'Захира кардан'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Боргирӣ...</p>
              </div>
            </div>
          ) : departments.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ҳоло шуъбае нест</p>
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
      <Footer />
    </div>
  );
}
