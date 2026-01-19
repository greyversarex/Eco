import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { LogOut, Settings, Plus, Pencil, Trash2, FileText, GripVertical, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { DocumentType } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

interface DocumentTypeFormData {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const initialFormData: DocumentTypeFormData = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminDocumentTypes() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: documentTypes = [], isLoading } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types/all'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: DocumentTypeFormData) => {
      return await apiRequest('POST', '/api/document-types', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: 'Намуди ҳуҷҷат илова шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DocumentTypeFormData> }) => {
      return await apiRequest('PATCH', `/api/document-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-types/all'] });
      toast({ title: 'Намуди ҳуҷҷат тағйир ёфт', variant: 'default' });
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
      toast({ title: 'Намуди ҳуҷҷат нест карда шуд', variant: 'default' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
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
      toast({ title: 'Номи намуди ҳуҷҷат ҳатмист', variant: 'destructive' });
      return;
    }

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">Намуди ҳуҷҷатҳо</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Идоракунии намудҳои ҳуҷҷат</p>
            </div>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2 sm:gap-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/dashboard')}
              data-testid="button-back"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Бозгашт</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t.logout}</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6 pt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Рӯйхати намуди ҳуҷҷатҳо</h2>
          <Button onClick={openCreateDialog} className="gap-2" data-testid="button-add-type">
            <Plus className="h-4 w-4" />
            Илова кардан
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documentTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ягон намуди ҳуҷҷат мавҷуд нест</p>
              <p className="text-sm mt-2">Барои илова кардан тугмаро пахш кунед</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documentTypes.map((docType) => (
              <Card 
                key={docType.id} 
                className={`transition-opacity ${!docType.isActive ? 'opacity-60' : ''}`}
                data-testid={`card-doctype-${docType.id}`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-move" />
                    <FileText className="h-5 w-5 text-primary shrink-0" />
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
                      onClick={() => openEditDialog(docType)}
                      data-testid={`button-edit-${docType.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(docType.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${docType.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Тағйир додани намуди ҳуҷҷат' : 'Илова кардани намуди ҳуҷҷат'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'Маълумоти намуди ҳуҷҷатро тағйир диҳед' : 'Намуди нави ҳуҷҷат илова кунед'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ном *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Масалан: Мактуби расмӣ"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Тавсиф</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Тавсифи намуди ҳуҷҷат"
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Тартиб</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-sort-order"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive">Фаъол</Label>
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
            <DialogTitle>Нест кардани намуди ҳуҷҷат</DialogTitle>
            <DialogDescription>
              Оё шумо мутмаин ҳастед, ки мехоҳед ин намуди ҳуҷҷатро нест кунед?
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
