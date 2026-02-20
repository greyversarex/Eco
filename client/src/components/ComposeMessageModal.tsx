import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Paperclip, X, Search, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { apiFetch } from '@/lib/api-config';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department, DocumentType } from '@shared/schema';
import {
  Dialog,
  DialogContent,
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientId?: number;
  assignmentId?: number;
  onSuccess?: () => void;
}

function ComposeForm({ 
  defaultRecipientId, 
  onClose, 
  onSuccess 
}: { 
  defaultRecipientId?: number; 
  onClose: () => void; 
  onSuccess?: () => void;
}) {
  const [documentNumber, setDocumentNumber] = useState('');
  const [svNumber, setSvNumber] = useState('');
  const [svDirection, setSvDirection] = useState<'outgoing' | 'incoming' | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>(
    defaultRecipientId ? [defaultRecipientId] : []
  );
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const isSubdepartment = user?.userType === 'department' && user.department?.isSubdepartment;
  const parentDepartmentId = user?.userType === 'department' ? user.department?.parentDepartmentId : null;

  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/all'],
  });

  const { data: siblingSubdepartments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments', parentDepartmentId, 'subdepartments'],
    enabled: !!isSubdepartment && !!parentDepartmentId,
  });

  const { data: allDocumentTypes = [] } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types'],
  });
  const documentTypes = allDocumentTypes.filter(dt => dt.category !== 'assignment');

  const availableRecipients = isSubdepartment && parentDepartmentId
    ? [
        ...departments.filter(d => d.id === parentDepartmentId),
        ...siblingSubdepartments.filter(d => d.id !== (user?.department?.id ?? null))
      ]
    : departments.filter(d => !d.parentDepartmentId);

  const filteredRecipients = availableRecipients.filter(dept =>
    dept.name.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.userType !== 'department') {
      toast({ title: 'Хато', description: 'Шумо ворид нашудаед', variant: 'destructive' });
      return;
    }

    if (!documentTypeId) {
      toast({ title: 'Хато', description: 'Намуди ҳуҷҷатро интихоб кунед', variant: 'destructive' });
      return;
    }

    const selectedDocType = documentTypes.find(dt => dt.id.toString() === documentTypeId);
    const docTypeName = selectedDocType?.name || 'Ҳуҷҷат';

    if (selectedRecipients.length === 0) {
      toast({ title: 'Хато', description: 'Ҳадди ақал як гиранда интихоб кунед', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRecipients.length > 1) {
        const formData = new FormData();
        formData.append('recipientIds', JSON.stringify(selectedRecipients));
        formData.append('subject', docTypeName);
        formData.append('content', content);
        formData.append('documentNumber', documentNumber || '');
        formData.append('documentTypeId', documentTypeId || '');
        if (svNumber) formData.append('svNumber', svNumber);
        if (svDirection) formData.append('svDirection', svDirection);
        formData.append('senderId', user.department.id.toString());
        formData.append('documentDate', new Date().toISOString());
        
        selectedFiles.forEach(file => formData.append('files', file));

        const response = await apiFetch('/api/messages/broadcast', { method: 'POST', body: formData });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send messages');
        }
        const result = await response.json();
        toast({ title: 'Муваффақият', description: `${result.messagesCreated} паём фиристода шуд` });
      } else {
        const messageData = {
          subject: docTypeName,
          content,
          documentNumber: documentNumber || null,
          documentTypeId: documentTypeId ? parseInt(documentTypeId) : null,
          svNumber: svNumber || null,
          svDirection: svDirection || null,
          senderId: user.department.id,
          recipientId: selectedRecipients[0],
          documentDate: new Date().toISOString(),
          replyToId: null,
        };

        const message = await apiRequest('POST', '/api/messages', messageData);

        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            await apiFetch(`/api/messages/${message.id}/attachments`, { method: 'POST', body: formData });
          }
        }

        toast({ 
          title: 'Муваффақият', 
          description: selectedFiles.length > 0 ? 'Паём ва файлҳо фиристода шуданд' : 'Паём фиристода шуд' 
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({ title: 'Хато', description: error.message || 'Хатогӣ ҳангоми фиристодани паём', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxSize = 100 * 1024 * 1024;
    
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast({ title: 'Хато', description: `Файл ${file.name} аз 100МБ калонтар аст`, variant: 'destructive' });
        return;
      }
    }
    
    const newFiles = [...selectedFiles, ...fileArray];
    if (newFiles.length > 5) {
      toast({ title: 'Хато', description: 'Шумо наметавонед зиёда аз 5 файл илова кунед', variant: 'destructive' });
      return;
    }
    
    setSelectedFiles(newFiles);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const toggleRecipient = (deptId: number) => {
    setSelectedRecipients(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Рақами ҳуҷҷат</Label>
          <Input
            id="documentNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="№"
            data-testid="input-document-number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="svNumber">Рақами С/В</Label>
          <div className="flex gap-2">
            <Input
              id="svNumber"
              value={svNumber}
              onChange={(e) => setSvNumber(e.target.value)}
              placeholder="Рақам"
              className="flex-1"
              data-testid="input-sv-number"
            />
            <Select value={svDirection || ''} onValueChange={(v) => setSvDirection(v as 'outgoing' | 'incoming' | null)}>
              <SelectTrigger className="w-24" data-testid="select-sv-direction">
                <SelectValue placeholder="С/В" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outgoing">С</SelectItem>
                <SelectItem value="incoming">В</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentType">Намуди ҳуҷҷат *</Label>
        <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
          <SelectTrigger data-testid="select-document-type">
            <SelectValue placeholder="Интихоб кунед" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Гирандагон *</Label>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ҷустуҷӯ..."
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            className="pl-9"
            data-testid="input-recipient-search"
          />
        </div>
        <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
          {filteredRecipients.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
              onClick={() => toggleRecipient(dept.id)}
            >
              <Checkbox
                checked={selectedRecipients.includes(dept.id)}
                onCheckedChange={() => toggleRecipient(dept.id)}
                data-testid={`checkbox-recipient-${dept.id}`}
              />
              <span className="text-sm">{dept.name}</span>
            </div>
          ))}
        </div>
        {selectedRecipients.length > 0 && (
          <p className="text-xs text-muted-foreground">Интихобшуда: {selectedRecipients.length}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Мазмун</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Матни ҳуҷҷат..."
          rows={4}
          data-testid="textarea-content"
        />
      </div>

      <div className="space-y-2">
        <Label>Файлҳо (то 5 файл, ҳар яке то 100МБ)</Label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('file-input-modal')?.click()} data-testid="button-attach-file">
            <Paperclip className="h-4 w-4 mr-2" />
            Файл илова кардан
          </Button>
          <input id="file-input-modal" type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>
        {selectedFiles.length > 0 && (
          <div className="space-y-2 mt-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                <Paperclip className="h-4 w-4" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} МБ</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)} data-testid={`button-remove-file-${index}`}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} data-testid="button-cancel">
          Бекор кардан
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700" data-testid="button-send">
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Фиристода истодааст...' : 'Фиристодан'}
        </Button>
      </div>
    </form>
  );
}

export function ComposeMessageModal({
  isOpen,
  onClose,
  defaultRecipientId,
  onSuccess,
}: ComposeMessageModalProps) {
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Ҳуҷҷати нав</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <ComposeForm
            key={isOpen ? 'open' : 'closed'}
            defaultRecipientId={defaultRecipientId}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
