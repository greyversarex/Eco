import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DepartmentIconUpload from '@/components/DepartmentIconUpload';
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
import { Building2, Mail, LogOut, Plus, Pencil, Trash2, RefreshCw, Copy, Search, Users, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Card Component
interface SortableCardProps {
  department: Department;
  onEdit: (dept: Department) => void;
  onCopyCode: (code: string) => void;
  onGenerateCode: (id: number) => void;
  onDelete: (id: number) => void;
  getBlockLabel: (block: string) => string;
  iconVersion?: number;
}

function SortableCard({ department, onEdit, onCopyCode, onGenerateCode, onDelete, getBlockLabel, iconVersion }: SortableCardProps) {
  const [hasCustomIcon, setHasCustomIcon] = useState(true);
  const iconSrc = `/api/departments/${department.id}/icon?v=${iconVersion || 0}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: department.id });

  useEffect(() => {
    setHasCustomIcon(true);
  }, [iconSrc]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div
        className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50"
        onClick={() => onEdit(department)}
        data-testid={`card-department-${department.id}`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Department Info */}
        <div className="pl-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* Department Icon */}
            <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
              {hasCustomIcon ? (
                <img 
                  src={iconSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setHasCustomIcon(false)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary rounded-md">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                {department.name}
              </h3>
              <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                {getBlockLabel(department.block)}
              </div>
            </div>
          </div>

          {/* Access Code */}
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
              {department.accessCode}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopyCode(department.accessCode);
              }}
              data-testid={`button-copy-${department.id}`}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Permission Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {department.canMonitor && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                Назорат
              </span>
            )}
            {department.canCreateAssignmentFromMessage && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                Вазифагузорӣ
              </span>
            )}
            {department.canCreateAssignment && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                Супоришҳо
              </span>
            )}
            {department.canCreateAnnouncement && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">
                Эълонҳо
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(department);
              }}
              data-testid={`button-edit-${department.id}`}
              className="flex-1"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Таҳрир
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateCode(department.id);
              }}
              data-testid={`button-generate-${department.id}`}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(department.id);
              }}
              data-testid={`button-delete-${department.id}`}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [newCanCreateAnnouncement, setNewCanCreateAnnouncement] = useState(false);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptBlock, setEditDeptBlock] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editCanMonitor, setEditCanMonitor] = useState(false);
  const [editCanCreateAssignmentFromMessage, setEditCanCreateAssignmentFromMessage] = useState(false);
  const [editCanCreateAssignment, setEditCanCreateAssignment] = useState(false);
  const [editCanCreateAnnouncement, setEditCanCreateAnnouncement] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allDepartments = [], isLoading, dataUpdatedAt } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Filter and group departments by search query and block
  const departmentsByBlock = useMemo(() => {
    const filtered = allDepartments.filter((dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      upper: filtered.filter((d) => d.block === 'upper').sort((a, b) => a.sortOrder - b.sortOrder),
      middle: filtered.filter((d) => d.block === 'middle').sort((a, b) => a.sortOrder - b.sortOrder),
      lower: filtered.filter((d) => d.block === 'lower').sort((a, b) => a.sortOrder - b.sortOrder),
      district: filtered.filter((d) => d.block === 'district').sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }, [allDepartments, searchQuery]);

  // Flatten for drag-and-drop
  const departments = useMemo(() => {
    return [
      ...departmentsByBlock.upper,
      ...departmentsByBlock.middle,
      ...departmentsByBlock.lower,
      ...departmentsByBlock.district,
    ];
  }, [departmentsByBlock]);

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

  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: number; sortOrder: number }>) => {
      return await apiRequest('POST', '/api/departments/reorder', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми тағйири тартиб',
        variant: 'destructive',
      });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = departments.findIndex((d) => d.id === active.id);
      const newIndex = departments.findIndex((d) => d.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(departments, oldIndex, newIndex);
        
        // Update sortOrder based on new positions
        const updates = reordered.map((dept, index) => ({
          id: dept.id,
          sortOrder: index,
        }));

        // Optimistically update UI
        queryClient.setQueryData(['/api/departments'], (old: Department[] = []) => {
          const newData = arrayMove(old, oldIndex, newIndex);
          return newData.map((dept, index) => ({
            ...dept,
            sortOrder: index,
          }));
        });

        // Save to backend
        reorderMutation.mutate(updates);
      }
    }
  };

  const handleAddDepartment = () => {
    if (newDeptName && newDeptBlock) {
      createMutation.mutate({ 
        name: newDeptName, 
        block: newDeptBlock,
        canMonitor: newCanMonitor,
        canCreateAssignmentFromMessage: newCanCreateAssignmentFromMessage,
        canCreateAssignment: newCanCreateAssignment,
        canCreateAnnouncement: newCanCreateAnnouncement,
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
    setEditCanCreateAnnouncement(dept.canCreateAnnouncement);
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
          canCreateAnnouncement: editCanCreateAnnouncement,
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
      setEditCanCreateAnnouncement(false);
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-can-create-announcement"
                        checked={newCanCreateAnnouncement}
                        onCheckedChange={(checked) => setNewCanCreateAnnouncement(checked as boolean)}
                        data-testid="checkbox-new-can-create-announcement"
                      />
                      <label htmlFor="new-can-create-announcement" className="text-sm cursor-pointer">
                        Эълонҳо (эҷоди эълон дар саҳифаи супоришҳо)
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
                  
                  <div className="space-y-2">
                    <Label>Иконкаи департамент</Label>
                    <DepartmentIconUpload
                      departmentId={editingDept?.id || null}
                      onUploadSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
                        toast({
                          title: 'Муваффақият',
                          description: 'Иконка бомуваффақият боргузорӣ шуд',
                        });
                      }}
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-can-create-announcement"
                        checked={editCanCreateAnnouncement}
                        onCheckedChange={(checked) => setEditCanCreateAnnouncement(checked as boolean)}
                        data-testid="checkbox-edit-can-create-announcement"
                      />
                      <label htmlFor="edit-can-create-announcement" className="text-sm cursor-pointer">
                        Эълонҳо (эҷоди эълон дар саҳифаи супоришҳо)
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={departments.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-8">
                  {departmentsByBlock.upper.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground px-2">{t.upperBlock}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {departmentsByBlock.upper.map((dept) => (
                          <SortableCard
                            key={dept.id}
                            department={dept}
                            onEdit={handleEditDepartment}
                            onCopyCode={handleCopyCode}
                            onGenerateCode={handleGenerateCode}
                            onDelete={handleDeleteDepartment}
                            getBlockLabel={getBlockLabel}
                            iconVersion={dataUpdatedAt}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.upper.length > 0 && departmentsByBlock.middle.length > 0 && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-4 border-primary/20"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.middle.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground px-2">{t.middleBlock}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {departmentsByBlock.middle.map((dept) => (
                          <SortableCard
                            key={dept.id}
                            department={dept}
                            onEdit={handleEditDepartment}
                            onCopyCode={handleCopyCode}
                            onGenerateCode={handleGenerateCode}
                            onDelete={handleDeleteDepartment}
                            getBlockLabel={getBlockLabel}
                            iconVersion={dataUpdatedAt}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.middle.length > 0 && departmentsByBlock.lower.length > 0 && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-4 border-primary/20"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.lower.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground px-2">{t.lowerBlock}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {departmentsByBlock.lower.map((dept) => (
                          <SortableCard
                            key={dept.id}
                            department={dept}
                            onEdit={handleEditDepartment}
                            onCopyCode={handleCopyCode}
                            onGenerateCode={handleGenerateCode}
                            onDelete={handleDeleteDepartment}
                            getBlockLabel={getBlockLabel}
                            iconVersion={dataUpdatedAt}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.lower.length > 0 && departmentsByBlock.district.length > 0 && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-4 border-primary/20"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  )}

                  {departmentsByBlock.district.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground px-2">{t.districtBlock}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {departmentsByBlock.district.map((dept) => (
                          <SortableCard
                            key={dept.id}
                            department={dept}
                            onEdit={handleEditDepartment}
                            onCopyCode={handleCopyCode}
                            onGenerateCode={handleGenerateCode}
                            onDelete={handleDeleteDepartment}
                            getBlockLabel={getBlockLabel}
                            iconVersion={dataUpdatedAt}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
