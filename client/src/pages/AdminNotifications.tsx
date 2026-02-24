import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Plus, Pencil, Trash2, Bell, ArrowLeft, Sparkles, Building2, ImagePlus, X, Crop } from 'lucide-react';
import ImageCropDialog from '@/components/ImageCropDialog';
import { EFFECT_TYPES, EffectType } from '@/components/CelebrationEffects';
import { CelebrationEffects } from '@/components/CelebrationEffects';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  imageData: string | null;
  imageMimeType: string | null;
  positiveButtonText: string | null;
  negativeButtonText: string | null;
  positiveButtonColor: string;
  negativeButtonColor: string;
  evasiveButton: string;
  effectType: string;
  isActive: boolean;
  recipientDepartmentIds: number[] | null;
  createdAt: string;
}

interface Department {
  id: number;
  name: string;
  shortName: string | null;
  sortOrder: number;
}

export default function AdminNotifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [positiveButtonText, setPositiveButtonText] = useState('');
  const [negativeButtonText, setNegativeButtonText] = useState('');
  const [positiveButtonColor, setPositiveButtonColor] = useState<string>('green');
  const [negativeButtonColor, setNegativeButtonColor] = useState<string>('red');
  const [evasiveButton, setEvasiveButton] = useState<string>('negative');
  const [effectType, setEffectType] = useState<string>('confetti');
  const [isActive, setIsActive] = useState(true);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [allDepartments, setAllDepartments] = useState(true);
  const [previewEffect, setPreviewEffect] = useState<EffectType | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
    queryKey: ['/api/admin/notifications'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments/all'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/admin/notifications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({ title: 'Огоҳинома сохта шуд' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Хатогӣ', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/admin/notifications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({ title: 'Огоҳинома нав карда шуд' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Хатогӣ', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({ title: 'Огоҳинома нест карда шуд' });
    },
    onError: (error: any) => {
      toast({ title: 'Хатогӣ', description: error.message, variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/admin/notifications/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingNotification(null);
    setTitle('');
    setMessage('');
    setPositiveButtonText('');
    setNegativeButtonText('');
    setPositiveButtonColor('green');
    setNegativeButtonColor('red');
    setEvasiveButton('negative');
    setEffectType('confetti');
    setIsActive(true);
    setSelectedDeptIds([]);
    setAllDepartments(true);
    setImageData(null);
    setImageMimeType(null);
  };

  const openEdit = (n: AdminNotification) => {
    setEditingNotification(n);
    setTitle(n.title);
    setMessage(n.message);
    setPositiveButtonText(n.positiveButtonText || '');
    setNegativeButtonText(n.negativeButtonText || '');
    setPositiveButtonColor((n as any).positiveButtonColor || 'green');
    setNegativeButtonColor((n as any).negativeButtonColor || 'red');
    setEvasiveButton((n as any).evasiveButton || 'negative');
    setEffectType(n.effectType);
    setIsActive(n.isActive);
    setImageData(n.imageData || null);
    setImageMimeType(n.imageMimeType || null);
    const isAll = !n.recipientDepartmentIds || n.recipientDepartmentIds.length === 0;
    setAllDepartments(isAll);
    setSelectedDeptIds(isAll ? [] : n.recipientDepartmentIds || []);
    setDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Андозаи файл зиёд аст', description: 'Ҳадди аксар 5 МБ', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImageData(base64);
      setImageMimeType(croppedBlob.type || 'image/png');
    };
    reader.readAsDataURL(croppedBlob);
    setCropDialogOpen(false);
    setRawImageSrc(null);
  };

  const handleRecrop = () => {
    if (imageData && imageMimeType) {
      setRawImageSrc(`data:${imageMimeType};base64,${imageData}`);
      setCropDialogOpen(true);
    }
  };

  const handleSubmit = () => {
    const data = {
      title,
      message,
      imageData: imageData || null,
      imageMimeType: imageMimeType || null,
      positiveButtonText: positiveButtonText.trim() || null,
      negativeButtonText: negativeButtonText.trim() || null,
      positiveButtonColor,
      negativeButtonColor,
      evasiveButton,
      effectType,
      isActive,
      recipientDepartmentIds: allDepartments ? null : selectedDeptIds,
    };
    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDept = (deptId: number) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const sortedDepartments = [...departments].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const getDeptNames = (ids: number[] | null) => {
    if (!ids || ids.length === 0) return 'Ҳама департаментҳо';
    const names = ids.map(id => {
      const dept = departments.find(d => d.id === id);
      return dept ? (dept.shortName || dept.name) : `#${id}`;
    });
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
  };

  const BUTTON_COLORS = [
    { id: 'green', name: 'Сабз', class: 'bg-green-600' },
    { id: 'red', name: 'Сурх', class: 'bg-red-600' },
    { id: 'orange', name: 'Норинҷӣ', class: 'bg-orange-500' },
    { id: 'yellow', name: 'Зард', class: 'bg-yellow-400 text-black' },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.92)' }} />

      {previewEffect && (
        <CelebrationEffects
          effectType={previewEffect}
          duration={3000}
          onComplete={() => setPreviewEffect(null)}
        />
      )}

      <PageHeader variant="admin">
        <PageHeaderContainer>
          <PageHeaderLeft>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/royalty/dashboard')}
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoImage} alt="" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-semibold text-white">Огоҳиномаҳо</h1>
          </PageHeaderLeft>
          <PageHeaderRight>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-white text-green-700 hover:bg-white/90"
              data-testid="button-create-notification"
            >
              <Plus className="h-4 w-4 mr-2" />
              Огоҳиномаи нав
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
        {isLoading ? (
          <div className="text-center py-12">Боргирӣ...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ҳанӯз огоҳиномаҳо нестанд</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card key={n.id} data-testid={`card-notification-${n.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{n.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${n.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {n.isActive ? 'Фаъол' : 'Ғайрифаъол'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-muted-foreground">
                        {n.positiveButtonText && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                            {n.positiveButtonText}
                          </span>
                        )}
                        {n.negativeButtonText && (
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">
                            {n.negativeButtonText}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {EFFECT_TYPES.find(e => e.id === n.effectType)?.name || n.effectType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getDeptNames(n.recipientDepartmentIds)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={n.isActive}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: n.id, isActive: checked })}
                        data-testid={`switch-notification-active-${n.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(n)}
                        data-testid={`button-edit-notification-${n.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Огоҳиномаро нест мекунед?')) {
                            deleteMutation.mutate(n.id);
                          }
                        }}
                        className="text-destructive"
                        data-testid={`button-delete-notification-${n.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? 'Тағйир додани огоҳинома' : 'Огоҳиномаи нав'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Сарлавҳа *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Сарлавҳаи огоҳинома"
                data-testid="input-notification-title"
              />
            </div>

            <div>
              <Label>Матни асосӣ *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Матни огоҳинома"
                rows={4}
                data-testid="input-notification-message"
              />
            </div>

            <div>
              <Label>Расм (ихтиёрӣ)</Label>
              {imageData ? (
                <div className="relative mt-1">
                  <img
                    src={`data:${imageMimeType};base64,${imageData}`}
                    alt="Preview"
                    className="w-full max-h-40 object-contain rounded-md border bg-muted/30"
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 bg-white/80 backdrop-blur-sm"
                      onClick={handleRecrop}
                      title="Танзими расм"
                      data-testid="button-recrop-image"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => { setImageData(null); setImageMimeType(null); }}
                      data-testid="button-remove-image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center gap-2 mt-1 cursor-pointer border border-dashed rounded-md p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span>Интихоби расм (то 5 МБ)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    data-testid="input-notification-image"
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Тугмаи мусбат</Label>
                <Input
                  value={positiveButtonText}
                  onChange={(e) => setPositiveButtonText(e.target.value)}
                  placeholder="Масалан: Ҳа"
                  data-testid="input-notification-positive"
                />
              </div>
              <div>
                <Label>Ранги тугма</Label>
                <Select value={positiveButtonColor} onValueChange={setPositiveButtonColor}>
                  <SelectTrigger data-testid="select-positive-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_COLORS.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${c.class}`} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Тугмаи манфӣ</Label>
                <Input
                  value={negativeButtonText}
                  onChange={(e) => setNegativeButtonText(e.target.value)}
                  placeholder="Масалан: Не"
                  data-testid="input-notification-negative"
                />
              </div>
              <div>
                <Label>Ранги тугма</Label>
                <Select value={negativeButtonColor} onValueChange={setNegativeButtonColor}>
                  <SelectTrigger data-testid="select-negative-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_COLORS.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${c.class}`} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Кадом тугма мегурезад?</Label>
              <Select value={evasiveButton} onValueChange={setEvasiveButton}>
                <SelectTrigger data-testid="select-evasive-button">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ҳеҷ кадомаш</SelectItem>
                  <SelectItem value="positive">Тугмаи мусбат</SelectItem>
                  <SelectItem value="negative">Тугмаи манфӣ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Эффект (ҳангоми ҷавоби мусбат)</Label>
              <div className="flex gap-2">
                <Select value={effectType} onValueChange={setEffectType}>
                  <SelectTrigger data-testid="select-notification-effect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFECT_TYPES.map((effect) => (
                      <SelectItem key={effect.id} value={effect.id}>
                        {effect.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewEffect(effectType as EffectType)}
                  title="Намоиш"
                  data-testid="button-preview-effect"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Департаментҳо</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={allDepartments}
                  onCheckedChange={(checked) => {
                    setAllDepartments(!!checked);
                    if (checked) setSelectedDeptIds([]);
                  }}
                  data-testid="checkbox-all-departments"
                />
                <Label className="text-sm font-normal cursor-pointer" onClick={() => {
                  setAllDepartments(!allDepartments);
                  if (!allDepartments) setSelectedDeptIds([]);
                }}>
                  Ҳама департаментҳо
                </Label>
              </div>

              {!allDepartments && (
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-1">
                    {sortedDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center gap-2 py-1 px-1 rounded hover-elevate cursor-pointer"
                        onClick={() => toggleDept(dept.id)}
                        data-testid={`checkbox-dept-${dept.id}`}
                      >
                        <Checkbox
                          checked={selectedDeptIds.includes(dept.id)}
                          onCheckedChange={() => toggleDept(dept.id)}
                        />
                        <span className="text-sm truncate">{dept.shortName || dept.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {!allDepartments && selectedDeptIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Интихоб шуд: {selectedDeptIds.length} департамент
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                data-testid="switch-notification-active"
              />
              <Label>Фаъол (нишон додан ба департаментҳо)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Бекор кардан
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !message.trim() || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-notification"
            >
              {editingNotification ? 'Нав кардан' : 'Сохтан'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rawImageSrc && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={() => { setCropDialogOpen(false); setRawImageSrc(null); }}
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
          aspect={16 / 9}
          title="Танзими расм"
        />
      )}
    </div>
  );
}
