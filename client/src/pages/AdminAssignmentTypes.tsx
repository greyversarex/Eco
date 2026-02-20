import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { LogOut, Plus, Pencil, Trash2, ClipboardList, GripVertical, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { DocumentType } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardProps {
  docType: DocumentType;
  onEdit: (docType: DocumentType) => void;
  onDelete: (id: number) => void;
}

function SortableCard({ docType, onEdit, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: docType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`transition-opacity ${!docType.isActive ? 'opacity-60' : ''}`}
        data-testid={`card-assigntype-${docType.id}`}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="touch-none cursor-grab active:cursor-grabbing p-1"
              data-testid={`drag-handle-assigntype-${docType.id}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
            <ClipboardList className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {docType.name}
                {!docType.isActive && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Ғайрифаъол
                  </span>
                )}
              </div>
              {docType.description && (
                <p className="text-sm text-muted-foreground truncate">{docType.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(docType)}
              data-testid={`button-edit-assigntype-${docType.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(docType.id)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-assigntype-${docType.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FormData {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminAssignmentTypes() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: allTypes = [], isLoading } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types/all'],
  });

  const assignmentTypes = allTypes.filter(dt => dt.category === 'assignment');

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('POST', '/api/document-types', { ...data, category: 'assignment' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: 'Намуди супориш илова шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      return await apiRequest('PATCH', `/api/document-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: 'Намуди супориш тағйир ёфт', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/document-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: 'Намуди супориш нест карда шуд', variant: 'default' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: number; sortOrder: number }>) => {
      return await apiRequest('POST', '/api/document-types/reorder', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: error.message || 'Хатогӣ дар тартибгузорӣ', variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingType(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (docType: DocumentType) => {
    setEditingType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || '',
      sortOrder: docType.sortOrder || 0,
      isActive: docType.isActive,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Номи намуди супориш ҳатмист', variant: 'destructive' });
      return;
    }
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = assignmentTypes.findIndex((dt) => dt.id === active.id);
      const newIndex = assignmentTypes.findIndex((dt) => dt.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(assignmentTypes, oldIndex, newIndex);
        const updates = reordered.map((dt, index) => ({ id: dt.id, sortOrder: index }));
        queryClient.setQueryData(['/api/document-types/all'], (old: DocumentType[] = []) => {
          const nonAssignment = old.filter(dt => dt.category !== 'assignment');
          const assignment = old.filter(dt => dt.category === 'assignment');
          const newAssignment = arrayMove(assignment, oldIndex, newIndex).map((dt, index) => ({ ...dt, sortOrder: index }));
          return [...nonAssignment, ...newAssignment];
        });
        reorderMutation.mutate(updates);
      }
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(255, 255, 255, 0.92)' }}
      />
      <PageHeader variant="admin">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 sm:gap-3 min-w-0 flex-1 pt-2">
            <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0" />
            <div className="min-w-0 text-left">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">Намуди супоришҳо</h1>
              <p className="text-xs text-white/70 hidden sm:block">Идоракунии намудҳои супориш</p>
            </div>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2 sm:gap-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/royalty/dashboard')}
              data-testid="button-back"
              className="gap-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Бозгашт</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
              className="gap-2 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t.logout}</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6 pt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Рӯйхати намуди супоришҳо</h2>
          <Button onClick={openCreateDialog} className="gap-2" data-testid="button-add-assigntype">
            <Plus className="h-4 w-4" />
            Илова кардан
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignmentTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ягон намуди супориш мавҷуд нест</p>
              <p className="text-sm mt-2">Барои илова кардан тугмаро пахш кунед</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={assignmentTypes.map(dt => dt.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {assignmentTypes.map((docType) => (
                  <SortableCard
                    key={docType.id}
                    docType={docType}
                    onEdit={openEditDialog}
                    onDelete={(id) => setDeleteConfirmId(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Тағйир додани намуди супориш' : 'Илова кардани намуди супориш'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'Маълумоти намуди супоришро тағйир диҳед' : 'Намуди нави супориш илова кунед'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ном *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Масалан: Протоколи ҷаласа"
                data-testid="input-assigntype-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Бекор кардан
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Сабт...' : 'Сабт кардан'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нест кардани намуди супориш</DialogTitle>
            <DialogDescription>
              Оё шумо мутмаин ҳастед, ки мехоҳед ин намуди супоришро нест кунед?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-delete-cancel">
              Не
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? 'Нест кардан...' : 'Ҳа, нест кунед'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
