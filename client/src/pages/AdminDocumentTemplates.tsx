import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Plus, Pencil, Trash2, FileText, ArrowLeft, Upload, Eye, Edit3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { DocumentTemplate } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { DocumentEditor } from '@/components/DocumentEditor';

interface TemplateFormData {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  file: File | null;
  htmlContent: string;
  creationMethod: 'upload' | 'editor';
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  file: null,
  htmlContent: '',
  creationMethod: 'editor',
};

export default function AdminDocumentTemplates() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  const { data: templates = [], isLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ['/api/document-templates/all'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/document-templates', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Хатогӣ');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates/all'] });
      toast({ title: 'Намунаи ҳуҷҷат илова шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const createWithHtmlMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; htmlContent: string; sortOrder: number; isActive: boolean }) => {
      return await apiRequest('POST', '/api/document-templates/html', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates/all'] });
      toast({ title: 'Намунаи ҳуҷҷат илова шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await fetch(`/api/document-templates/${id}`, {
        method: 'PATCH',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Хатогӣ');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates/all'] });
      toast({ title: 'Намунаи ҳуҷҷат тағйир ёфт', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const updateWithHtmlMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; htmlContent: string; sortOrder: number; isActive: boolean } }) => {
      return await apiRequest('PATCH', `/api/document-templates/${id}/html`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates/all'] });
      toast({ title: 'Намунаи ҳуҷҷат тағйир ёфт', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/document-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-templates/all'] });
      toast({ title: 'Намунаи ҳуҷҷат нест карда шуд', variant: 'default' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditorDialogOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setEditorContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData(initialFormData);
    setEditorContent('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      sortOrder: template.sortOrder,
      isActive: template.isActive,
      file: null,
      htmlContent: template.htmlContent,
      creationMethod: 'editor',
    });
    setEditorContent(template.htmlContent);
    setIsDialogOpen(true);
  };

  const openEditorFullscreen = () => {
    setIsDialogOpen(false);
    setIsEditorDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Номи намуна ҳатмист', variant: 'destructive' });
      return;
    }

    if (formData.creationMethod === 'editor') {
      if (!editorContent || editorContent === '<p></p>') {
        toast({ title: 'Мундариҷаи ҳуҷҷат холӣ аст', variant: 'destructive' });
        return;
      }

      const htmlData = {
        name: formData.name.trim(),
        description: formData.description,
        htmlContent: editorContent,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      if (editingTemplate) {
        updateWithHtmlMutation.mutate({ id: editingTemplate.id, data: htmlData });
      } else {
        createWithHtmlMutation.mutate(htmlData);
      }
    } else {
      if (!editingTemplate && !formData.file) {
        toast({ title: 'Файли .docx ҳатмист', variant: 'destructive' });
        return;
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description);
      data.append('sortOrder', formData.sortOrder.toString());
      data.append('isActive', formData.isActive.toString());
      if (formData.file) {
        data.append('file', formData.file);
      }

      if (editingTemplate) {
        updateMutation.mutate({ id: editingTemplate.id, data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast({ title: 'Танҳо файлҳои .docx қабул мешаванд', variant: 'destructive' });
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/royalty/login');
  };

  const isPending = createMutation.isPending || updateMutation.isPending || 
                    createWithHtmlMutation.isPending || updateWithHtmlMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      <PageHeader variant="admin">
        <PageHeaderContainer>
          <PageHeaderLeft>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/royalty')}
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Бозгашт
            </Button>
          </PageHeaderLeft>
          <PageHeaderRight>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Баромадан
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Намунаҳои ҳуҷҷатҳо</h1>
            </div>
            <Button onClick={openCreateDialog} data-testid="button-add-template">
              <Plus className="h-4 w-4 mr-2" />
              Илова кардан
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ягон намунаи ҳуҷҷат нест</p>
                <p className="text-sm mt-2">Намунаро дар редактор эҷод кунед ё файли .docx боргузорӣ кунед</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-500 truncate">{template.description}</p>
                          )}
                          {template.originalFileName && (
                            <p className="text-xs text-gray-400 mt-1">
                              Файл: {template.originalFileName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!template.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Ғайрифаъол
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewTemplate(template)}
                          data-testid={`button-preview-template-${template.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Тағйири намуна' : 'Намунаи нав'}
            </DialogTitle>
            <DialogDescription>
              Намунаро дар редактор эҷод кунед ё файли .docx боргузорӣ кунед
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Номи намуна *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Масалан: Гузориш"
                data-testid="input-template-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Тавсиф</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Тавсифи мухтасар"
                rows={2}
                data-testid="input-template-description"
              />
            </div>

            <Tabs 
              value={formData.creationMethod} 
              onValueChange={(v) => setFormData({ ...formData, creationMethod: v as 'upload' | 'editor' })}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Редактор
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Боргузорӣ .docx
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
                    <span className="text-sm text-gray-600">Мундариҷаи ҳуҷҷат</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openEditorFullscreen}
                      data-testid="button-open-fullscreen-editor"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Кушодани редактори калон
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <DocumentEditor
                      content={editorContent}
                      onChange={setEditorContent}
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Тавсия: Барои таҳрири пурра "Кушодани редактори калон"-ро пахш кунед
                </p>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div>
                  <Label htmlFor="file">
                    Файли .docx {editingTemplate ? '(барои иваз кардан)' : '*'}
                  </Label>
                  <div className="mt-1">
                    <Input
                      ref={fileInputRef}
                      id="file"
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      data-testid="input-template-file"
                    />
                  </div>
                  {formData.file && (
                    <p className="text-sm text-green-600 mt-1">
                      Интихоб шуд: {formData.file.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Огоҳӣ: Ҳангоми боргузорӣ баъзе форматҳо гум мешаванд. Барои нигоҳ доштани форматҳо, аз редактор истифода баред.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sortOrder">Тартиб</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-template-sort-order"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-template-active"
                />
                <Label htmlFor="isActive">Фаъол</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Бекор кардан
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isPending}
              data-testid="button-save"
            >
              {isPending ? 'Сабт...' : 'Сабт кардан'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorDialogOpen} onOpenChange={setIsEditorDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Таҳрири намуна: {formData.name || 'Номи нав'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Мундариҷаи ҳуҷҷатро таҳрир кунед
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden border rounded-lg">
            <DocumentEditor
              content={editorContent}
              onChange={setEditorContent}
              className="h-full"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditorDialogOpen(false);
                setIsDialogOpen(true);
              }}
            >
              Бозгашт
            </Button>
            <Button 
              onClick={() => {
                setIsEditorDialogOpen(false);
                setIsDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Тасдиқ кардан
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Нест кардани намуна</DialogTitle>
            <DialogDescription>
              Шумо мутмаин ҳастед, ки мехоҳед ин намунаро нест кунед?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Не
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Нест...' : 'Ҳа, нест кунед'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewTemplate !== null} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Пешнамоиши намуна
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-sm max-w-none p-4 border rounded-lg bg-white"
            style={{ fontFamily: "'Times New Roman', serif", fontSize: '14pt', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: previewTemplate?.htmlContent || '' }}
          />
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>
              Пӯшидан
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
