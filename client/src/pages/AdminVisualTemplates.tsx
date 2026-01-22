import { useState, useRef, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Plus, Pencil, Trash2, ArrowLeft, Upload, Eye, Move, GripVertical, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { VisualTemplate, VisualTemplateField } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

interface TemplateFormData {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  file: File | null;
  fields: VisualTemplateField[];
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  file: null,
  fields: [],
};

const defaultFields: Partial<VisualTemplateField>[] = [
  { name: 'number', label: 'Рақами ҳуҷҷат', placeholder: '№' },
  { name: 'date.day', label: 'Рӯз', placeholder: '01' },
  { name: 'date.month', label: 'Моҳ', placeholder: 'январ' },
  { name: 'date.year', label: 'Сол', placeholder: '2024' },
  { name: 'recipient', label: 'Гиранда', placeholder: 'Ба...' },
  { name: 'subject', label: 'Мавзӯъ', placeholder: 'Дар бораи...' },
  { name: 'content', label: 'Мазмун', placeholder: 'Матни асосӣ...' },
  { name: 'signature', label: 'Имзо', placeholder: 'Номи пурра' },
];

export default function AdminVisualTemplates() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<(VisualTemplate & { backgroundImage?: string }) | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { data: templates = [], isLoading } = useQuery<(VisualTemplate & { hasBackground: boolean })[]>({
    queryKey: ['/api/visual-templates/all'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/visual-templates', {
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
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates/all'] });
      toast({ title: 'Намунаи визуалӣ илова шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await fetch(`/api/visual-templates/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates/all'] });
      toast({ title: 'Намунаи визуалӣ нав шуд', variant: 'default' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/visual-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Хатогӣ');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visual-templates/all'] });
      toast({ title: 'Намунаи визуалӣ нест шуд', variant: 'default' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Хатогӣ', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setPreviewUrl(null);
    setSelectedFieldId(null);
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (template: VisualTemplate & { hasBackground: boolean }) => {
    const response = await fetch(`/api/visual-templates/${template.id}`, {
      credentials: 'include',
    });
    if (response.ok) {
      const fullTemplate = await response.json();
      setEditingTemplate(fullTemplate);
      setFormData({
        name: fullTemplate.name,
        description: fullTemplate.description || '',
        sortOrder: fullTemplate.sortOrder,
        isActive: fullTemplate.isActive,
        file: null,
        fields: (fullTemplate.fields as VisualTemplateField[]) || [],
      });
      setPreviewUrl(fullTemplate.backgroundImage);
      setIsDialogOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const addField = (defaultField: Partial<VisualTemplateField>) => {
    const newField: VisualTemplateField = {
      id: `field_${Date.now()}`,
      name: defaultField.name || 'custom',
      label: defaultField.label || 'Майдони нав',
      x: 10,
      y: 20,
      width: 20,
      height: 5,
      fontSize: 12,
      fontFamily: 'Times New Roman',
      textAlign: 'left',
      placeholder: defaultField.placeholder || '',
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<VisualTemplateField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
    }));
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setIsDragging(true);
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const field = formData.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const fieldX = (field.x / 100) * rect.width;
    const fieldY = (field.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - fieldX,
      y: e.clientY - rect.top - fieldY,
    });
  }, [formData.fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedFieldId || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    updateField(selectedFieldId, { x: clampedX, y: clampedY });
  }, [isDragging, selectedFieldId, dragOffset, updateField]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Номи намуна ҳатмист', variant: 'destructive' });
      return;
    }
    
    if (!editingTemplate && !formData.file) {
      toast({ title: 'Тасвири замина ҳатмист', variant: 'destructive' });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('description', formData.description.trim());
    data.append('sortOrder', formData.sortOrder.toString());
    data.append('isActive', formData.isActive.toString());
    data.append('fields', JSON.stringify(formData.fields));
    
    if (formData.file) {
      data.append('backgroundImage', formData.file);
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedField = formData.fields.find(f => f.id === selectedFieldId);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <PageHeaderContainer className="bg-gradient-to-r from-green-600 to-green-700">
        <PageHeader>
          <PageHeaderLeft>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin')}
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white">Намунаҳои визуалӣ</h1>
          </PageHeaderLeft>
          <PageHeaderRight>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white hover:bg-white/20"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Баромад
            </Button>
          </PageHeaderRight>
        </PageHeader>
      </PageHeaderContainer>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Намунаҳои ҳуҷҷатҳо бо тасвири замина ва майдонҳои ҷойгиршаванда
          </p>
          <Button onClick={openCreateDialog} data-testid="button-add-template">
            <Plus className="h-4 w-4 mr-2" />
            Илова кардан
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Боргирӣ...</div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Ягон намунаи визуалӣ вуҷуд надорад
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover-elevate">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{template.name}</span>
                    {!template.isActive && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">Ғайрифаъол</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Таҳрир
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(template.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-template-${template.id}`}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Таҳрири намунаи визуалӣ' : 'Илова кардани намунаи визуалӣ'}
            </DialogTitle>
            <DialogDescription>
              Тасвири замина ё PDF боргузорӣ кунед ва майдонҳои ворид кардани маълумотро ҷойгир кунед
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Номи намуна *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Масалан: Мактуби расмӣ"
                    data-testid="input-template-name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Тавсиф</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Тавсифи мухтасар..."
                    rows={2}
                    data-testid="input-template-description"
                  />
                </div>

                <div>
                  <Label>Тасвири замина *</Label>
                  <div className="mt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg"
                      className="hidden"
                      data-testid="input-template-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.file ? formData.file.name : 'Интихоби тасвир (PNG, JPEG)'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF-ро пеш аз боргузорӣ ба тасвир табдил диҳед
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Фаъол</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    data-testid="switch-template-active"
                  />
                </div>

                <div>
                  <Label>Илова кардани майдон</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {defaultFields.map((field) => (
                      <Button
                        key={field.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(field)}
                        className="justify-start text-xs"
                        data-testid={`button-add-field-${field.name}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {field.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedField && (
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Танзимоти майдон: {selectedField.label}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeField(selectedField.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Андоза (pt)</Label>
                          <Input
                            type="number"
                            value={selectedField.fontSize || 12}
                            onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Ҷойгиршавӣ</Label>
                          <Select
                            value={selectedField.textAlign || 'left'}
                            onValueChange={(value) => updateField(selectedField.id, { textAlign: value as 'left' | 'center' | 'right' })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Чап</SelectItem>
                              <SelectItem value="center">Марказ</SelectItem>
                              <SelectItem value="right">Рост</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Бараш (%)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedField.width)}
                            onChange={(e) => updateField(selectedField.id, { width: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Баландӣ (%)</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedField.height)}
                            onChange={(e) => updateField(selectedField.id, { height: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-2">
                <Label>Пешнамоиш (майдонҳоро кашед ва ҷой гузоред)</Label>
                <div
                  ref={containerRef}
                  className="relative border rounded-lg bg-white overflow-hidden"
                  style={{ aspectRatio: '595/842' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Template background"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Тасвири заминаро интихоб кунед
                    </div>
                  )}
                  
                  {formData.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 rounded cursor-move flex items-center px-1 ${
                        selectedFieldId === field.id 
                          ? 'border-primary bg-primary/20' 
                          : 'border-blue-400 bg-blue-100/50'
                      }`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                        fontSize: `${(field.fontSize || 12) * 0.6}px`,
                        textAlign: field.textAlign || 'left',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      data-testid={`field-${field.id}`}
                    >
                      <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs ml-1">{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Бекор кардан
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-template"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Сабт шуда истодааст...' : 'Сабт кардан'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нест кардани намуна</DialogTitle>
            <DialogDescription>
              Оё мутмаин ҳастед, ки мехоҳед ин намунаро нест кунед? Ин амал баргардонида намешавад.
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
              {deleteMutation.isPending ? 'Нест шуда истодааст...' : 'Ҳа, нест кунед'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
