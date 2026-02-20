import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf, Trash2, LogOut, FileText, X, Forward, Check, XCircle, Eye, Edit, Save } from 'lucide-react';
import { DocumentEditor } from '@/components/DocumentEditor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { apiFetch, buildApiUrl } from '@/lib/api-config';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department, Person, DocumentType, MessageDocument } from '@shared/schema';
import { format } from 'date-fns';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { offlineDB } from '@/lib/offline-db';
import { useOnlineStatus } from '@/hooks/use-offline';
import { DocumentStamp, StampButtons } from '@/components/DocumentStamp';

interface Attachment {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const formatDateTajik = (date: Date) => {
  const monthsTajik = [
    'январ', 'феврал', 'март', 'апрел', 'май', 'июн',
    'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'
  ];
  
  const day = date.getDate();
  const month = monthsTajik[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export default function MessageView() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Assignment modal state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignmentDocumentTypeId, setAssignmentDocumentTypeId] = useState('');
  const [assignmentContent, setAssignmentContent] = useState('');
  const [assignmentDocNumber, setAssignmentDocNumber] = useState('');
  const [selectedExecutorIds, setSelectedExecutorIds] = useState<number[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [showAllInvited, setShowAllInvited] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  
  // Forward modal state
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [forwardRecipientIds, setForwardRecipientIds] = useState<number[]>([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  
  // Document editor state
  const [editingDocument, setEditingDocument] = useState<MessageDocument | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isDocumentEditorOpen, setIsDocumentEditorOpen] = useState(false);
  
  // Attachment editor state
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [attachmentContent, setAttachmentContent] = useState('');
  const [isAttachmentEditorOpen, setIsAttachmentEditorOpen] = useState(false);
  const [isLoadingAttachment, setIsLoadingAttachment] = useState(false);
  
  // Get 'from' query parameter to know where to go back
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');

  const { data: message, isLoading } = useQuery<Message>({
    queryKey: ['/api/messages', id],
    enabled: !!id,
  });

  // Load ALL departments (including subdepartments) for lookups (sender name, recipients, etc.)
  const { data: departments = [], isLoading: loadingDepartments } = useQuery<any[]>({
    queryKey: ['/api/departments/all'],
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['/api/people'],
  });

  const { data: documentTypes = [] } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types'],
  });

  // Load attachments from database
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['/api/messages', id, 'attachments'],
    enabled: !!id,
  });

  // Load original message if this is a reply
  const { data: originalMessage } = useQuery<Message>({
    queryKey: ['/api/messages', message?.replyToId],
    enabled: !!message?.replyToId,
  });

  // Load attached documents
  const { data: messageDocuments = [] } = useQuery<MessageDocument[]>({
    queryKey: ['/api/messages', id, 'documents'],
    enabled: !!id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('PATCH', `/api/messages/${messageId}/read`, undefined);
    },
    onSuccess: () => {
      // Invalidate queries to refresh message lists
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
    },
    onError: (error: any) => {
      console.error('Failed to mark message as read:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми навсозии ҳолат',
        variant: 'destructive',
      });
    },
  });

  // Automatically mark message as read when opened (only if current user is the recipient)
  useEffect(() => {
    if (id && message && !message.isRead && user?.userType === 'department' && !markAsReadMutation.isPending) {
      const currentDepartmentId = user.department.id;
      // Check if current user is recipient (either via recipientId or recipientIds array)
      const isRecipient = message.recipientId === currentDepartmentId || 
                          (message.recipientIds && message.recipientIds.includes(currentDepartmentId));
      
      if (isRecipient) {
        markAsReadMutation.mutate(id);
      }
    }
  }, [id, message?.isRead, message?.recipientId, message?.recipientIds, user, markAsReadMutation.isPending]);

  const getSenderName = (senderId: number) => {
    const dept = departments.find(d => d.id === senderId);
    return dept?.name || '';
  };

  const getRecipientName = (recipientId: number) => {
    const dept = departments.find(d => d.id === recipientId);
    return dept?.name || '';
  };

  const handleReply = () => {
    if (id) {
      setLocation(`/department/compose?replyTo=${id}`);
    }
  };

  // Determine if current message is sent or received
  const isSentMessage = message && user?.userType === 'department' && message.senderId === user.department.id;
  
  // Determine back location - prioritize 'from' parameter, then fall back to inbox/outbox
  let backLocation = '/department/inbox';
  if (fromPage) {
    backLocation = fromPage;
  } else if (user?.userType === 'admin') {
    backLocation = '/royalty/departments';
  } else if (isSentMessage) {
    backLocation = '/department/outbox';
  }

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('DELETE', `/api/messages/${messageId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: 'Муваффақият',
        description: 'Ҳуҷҷат бекор карда шуд',
      });
      // Invalidate queries and go back to appropriate list
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      setLocation(backLocation);
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми несткунии ҳуҷҷат',
        variant: 'destructive',
      });
    },
  });

  const forwardMessageMutation = useMutation({
    mutationFn: async () => {
      if (!id || forwardRecipientIds.length === 0) {
        throw new Error('At least one recipient required');
      }
      
      const res = await apiFetch(`/api/messages/${id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIds: forwardRecipientIds }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to forward message');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Муваффақият',
        description: 'Ҳуҷҷат иловашуд',
      });
      setIsForwardDialogOpen(false);
      setForwardRecipientIds([]);
      setForwardSearchQuery('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми иловакунии ҳуҷҷат',
        variant: 'destructive',
      });
    },
  });

  // Document update mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ documentId, htmlContent }: { documentId: number; htmlContent: string }) => {
      const res = await apiFetch(`/api/message-documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update document');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Муваффақият',
        description: 'Ҳуҷҷат сабт шуд',
      });
      setIsDocumentEditorOpen(false);
      setEditingDocument(null);
      setEditedContent('');
      if (id) {
        // Invalidate all relevant cache keys
        queryClient.invalidateQueries({ queryKey: ['/api/messages', id, 'documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages', id] });
        queryClient.invalidateQueries({ queryKey: ['/api/message-documents'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми сабти ҳуҷҷат',
        variant: 'destructive',
      });
    },
  });

  const handleOpenDocumentEditor = (doc: MessageDocument) => {
    setEditingDocument(doc);
    setEditedContent(doc.htmlContent);
    setIsDocumentEditorOpen(true);
  };

  const handleSaveDocument = () => {
    if (editingDocument) {
      updateDocumentMutation.mutate({ 
        documentId: editingDocument.id, 
        htmlContent: editedContent 
      });
    }
  };

  // Check if attachment can be edited in document editor
  const isEditableAttachment = (mimeType: string, filename: string) => {
    const editableMimeTypes = [
      'text/html',
      'text/plain',
      'application/xhtml+xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const editableExtensions = ['.html', '.htm', '.txt', '.md', '.doc', '.docx'];
    const lowerFilename = filename.toLowerCase();
    return editableMimeTypes.includes(mimeType) || 
           editableExtensions.some(ext => lowerFilename.endsWith(ext));
  };
  
  // Check if file is a Word document
  const isWordDocument = (mimeType: string, filename: string) => {
    const wordMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const lowerFilename = filename.toLowerCase();
    return wordMimeTypes.includes(mimeType) || 
           lowerFilename.endsWith('.doc') || lowerFilename.endsWith('.docx');
  };

  // Load attachment content and open editor
  const handleEditAttachment = async (attachment: Attachment) => {
    setIsLoadingAttachment(true);
    try {
      const response = await apiFetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) throw new Error('Failed to load attachment');
      
      const blob = await response.blob();
      let htmlContent = '';
      
      // Handle Word documents using mammoth
      if (isWordDocument(attachment.mimeType, attachment.filename)) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } else {
        const text = await blob.text();
        // If it's plain text, wrap it in basic HTML
        if (attachment.mimeType === 'text/plain' || attachment.filename.toLowerCase().endsWith('.txt')) {
          htmlContent = `<p>${text.split('\n').join('</p><p>')}</p>`;
        } else {
          htmlContent = text;
        }
      }
      
      setEditingAttachment(attachment);
      setAttachmentContent(htmlContent);
      setIsAttachmentEditorOpen(true);
    } catch (error) {
      console.error('Error loading attachment:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми боркунии файл',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAttachment(false);
    }
  };

  // Save edited attachment as new document
  const handleSaveAttachmentAsDocument = async () => {
    if (!editingAttachment || !id) return;
    
    try {
      const response = await apiFetch('/api/message-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: parseInt(id),
          title: editingAttachment.filename.replace(/\.[^/.]+$/, ''),
          htmlContent: attachmentContent,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to save document');
      
      queryClient.invalidateQueries({ queryKey: ['/api/messages', id, 'documents'] });
      toast({
        title: 'Муваффақият',
        description: 'Ҳуҷҷат сабт шуд',
      });
      setIsAttachmentEditorOpen(false);
      setEditingAttachment(null);
      setAttachmentContent('');
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми сабти ҳуҷҷат',
        variant: 'destructive',
      });
    }
  };

  const createAssignmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiFetch('/api/assignments', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create assignment');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: 'Муваффақият',
        description: 'Супориш эҷод шуд',
      });
      setIsAssignmentDialogOpen(false);
      // Clear form
      setAssignmentDocumentTypeId('');
      setAssignmentContent('');
      setAssignmentDocNumber('');
      setSelectedExecutorIds([]);
      setSelectedRecipients([]);
      setShowAllInvited(false);
      setAssignmentDeadline('');
      setAssignmentFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ status }: { status: 'approved' | 'rejected' }) => {
      return await apiRequest('PATCH', `/api/messages/${id}/approve`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: status === 'approved' ? 'Тасдиқ шуд' : 'Рад карда шуд',
        description: status === 'approved' 
          ? 'Паём бомуваффақият тасдиқ карда шуд' 
          : 'Паём рад карда шуд',
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

  const handleApprove = () => {
    approvalMutation.mutate({ status: 'approved' });
  };

  const handleReject = () => {
    approvalMutation.mutate({ status: 'rejected' });
  };

  const handleDelete = () => {
    if (!id) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      'Шумо мутмаин ҳастед, ки мехоҳед ин ҳуҷҷатро бекор кунед?'
    );
    
    if (confirmed) {
      deleteMessageMutation.mutate(id);
    }
  };

  const isOnline = useOnlineStatus();

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      // Check cache first
      const cachedFile = await offlineDB.getAttachment(attachmentId);
      
      if (cachedFile) {
        // Use cached file
        console.log('📦 Using cached attachment:', fileName);
        const blob = cachedFile.data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Not in cache - check if online
      if (!isOnline) {
        toast({
          title: 'Офлайн',
          description: 'Файл дар кеш нест. Барои боргирӣ интернет лозим аст',
          variant: 'destructive',
        });
        return;
      }

      // Download from server
      console.log('🌐 Downloading attachment from server:', fileName);
      const response = await apiFetch(`/api/attachments/${attachmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Cache for offline use
      await offlineDB.cacheAttachment({
        id: attachmentId,
        messageId: parseInt(id || '0'),
        filename: fileName,
        mimeType: contentType,
        size: blob.size,
        data: blob,
        cachedAt: Date.now(),
      });

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Attachment downloaded and cached');
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми боргирӣ',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (attachmentId: number, fileName: string, mimeType: string) => {
    try {
      const response = await apiFetch(`/api/attachments/${attachmentId}`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const ext = fileName.toLowerCase().split('.').pop();
      
      if (mimeType.startsWith('image/') || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp') {
        window.open(url, '_blank');
      } else if (mimeType === 'application/pdf' || ext === 'pdf') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Файл боргирӣ шуд',
          description: 'Барои дидан файлро кушоед',
        });
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми кушодани файл',
        variant: 'destructive',
      });
    }
  };

  // Open assignment dialog with pre-filled data from message
  const openAssignmentDialog = async () => {
    if (!message) return;
    
    // Pre-fill document type from message
    setAssignmentDocumentTypeId(message.documentTypeId?.toString() || '');
    
    // Pre-fill content from message content (not subject!)
    setAssignmentContent(message.content || '');
    
    // Pre-fill document number if available
    if (message.documentNumber) {
      setAssignmentDocNumber(message.documentNumber);
    }
    
    // Copy attachments from message to assignment
    if (attachments && attachments.length > 0) {
      try {
        const filePromises = attachments.map(async (attachment) => {
          const response = await apiFetch(`/api/attachments/${attachment.id}`);
          const blob = await response.blob();
          return new File([blob], attachment.filename, { type: attachment.mimeType });
        });
        const files = await Promise.all(filePromises);
        setAssignmentFiles(files);
      } catch (error) {
        console.error('Failed to copy attachments:', error);
      }
    }
    
    setIsAssignmentDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (assignmentFiles.length + filesArray.length > 5) {
        toast({
          title: 'Хато',
          description: 'Шумо танҳо то 5 файл метавонед илова кунед',
          variant: 'destructive',
        });
        return;
      }
      setAssignmentFiles([...assignmentFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAssignmentFiles(assignmentFiles.filter((_, i) => i !== index));
  };

  const handleSubmitAssignment = () => {
    if (!assignmentDocumentTypeId) {
      toast({
        title: 'Хато',
        description: 'Намуди ҳуҷҷатро интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (selectedRecipients.length === 0) {
      toast({
        title: 'Хато',
        description: 'Ҳадди ақал як қабулкунанда интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (!assignmentDeadline) {
      toast({
        title: 'Хато',
        description: 'Мӯҳлати иҷроро муайян кунед',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('documentTypeId', assignmentDocumentTypeId);
    if (assignmentContent) {
      formData.append('content', assignmentContent);
    }
    if (assignmentDocNumber) {
      formData.append('documentNumber', assignmentDocNumber);
    }
    formData.append('executorIds', JSON.stringify(selectedExecutorIds));
    formData.append('recipientIds', JSON.stringify(selectedRecipients));
    formData.append('deadline', assignmentDeadline);
    
    assignmentFiles.forEach((file) => {
      formData.append('files', file);
    });

    createAssignmentMutation.mutate(formData);
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative"
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
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-6xl">
          <PageHeaderLeft className="gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(backLocation)}
              data-testid="button-back"
              className="shrink-0 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button 
              onClick={() => setLocation('/department/main')}
              className="flex items-start gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity pt-1"
              data-testid="button-home"
            >
              <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">{message?.subject || 'EcoDoc - Портали электронӣ'}</h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2">
            <Button
              size="sm"
              onClick={() => {
                apiFetch('/api/auth/logout', { method: 'POST' })
                  .then(() => setLocation('/'));
              }}
              data-testid="button-logout"
              className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white border-0 font-medium shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Баромад</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : !message ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Паём ёфт нашуд
            </p>
          </Card>
        ) : (
          <div className="w-full space-y-4">
            {originalMessage && (
              <Card className="w-full bg-white dark:bg-slate-900" data-testid="original-message">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Reply className="h-4 w-4" />
                    <span>Ҷавоб ба паём</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid="original-subject">{originalMessage.subject}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t.sender}:</span> {getSenderName(originalMessage.senderId)}
                      {' • '}
                      <span>{formatDateTajik(new Date(originalMessage.documentDate))}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3" data-testid="original-content">
                    {originalMessage.content}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="w-full border-border/40 bg-white dark:bg-slate-900">
              <CardHeader className="pb-6 space-y-6 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-xl font-semibold text-foreground" data-testid="text-subject">{message.subject}</h2>
                  </div>
                  {user?.userType === 'admin' && (
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        onClick={handleDelete} 
                        data-testid="button-delete" 
                        variant="destructive"
                        size="lg"
                        className="gap-2"
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteMessageMutation.isPending 
                          ? 'Бекор шуда истодааст...'
                          : 'Бекор кардан'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6 px-0">
                <div data-testid="text-content" className="px-6">
                  <div className="whitespace-pre-line text-lg leading-relaxed text-foreground">
                    {message.content}
                  </div>
                </div>

                <div className="space-y-3 text-base border-t pt-6 px-6">
                  {(message as any).svNumber && (
                    <div data-testid="text-sv-number">
                      <span className="font-medium text-[#050505]">
                        {(message as any).svDirection === 'outgoing' ? 'Рақами содиротӣ:' : (message as any).svDirection === 'incoming' ? 'Рақами воридотӣ:' : 'Рақами тартибӣ:'}
                      </span>
                      <span className="ml-2 text-foreground">{(message as any).svNumber}</span>
                    </div>
                  )}
                  {message.documentNumber && (
                    <div data-testid="text-document-number">
                      <span className="font-medium text-[#050505]">Рақами ҳуҷҷат:</span>
                      <span className="ml-2 text-foreground">{message.documentNumber}</span>
                    </div>
                  )}
                  <div data-testid="text-date">
                    <span className="font-medium text-[#000000]">Сана:</span>
                    <span className="ml-2 text-foreground">{formatDateTajik(new Date(message.documentDate))}</span>
                  </div>
                  <div data-testid="text-sender" className="space-y-1">
                    <div className="text-foreground">
                      <span className="font-medium text-[#000000]">Фиристанда:</span> {getSenderName(message.senderId)}
                    </div>
                  </div>
                  {message.originalSenderId && message.forwardedById && (
                    <div data-testid="text-forwarded-info" className="space-y-1 bg-accent/30 p-3 rounded-md">
                      <div className="text-foreground text-sm">
                        <span className="font-medium text-[#000000]">Муаллифи аслӣ:</span> {getSenderName(message.originalSenderId)}
                      </div>
                      <div className="text-foreground text-sm">
                        <span className="font-medium text-[#000000]">Иловакунанда:</span> {getSenderName(message.forwardedById)}
                      </div>
                    </div>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-4 pt-4 border-t px-6">
                    <h3 className="text-xl font-semibold text-foreground">
                      Замимашудаҳо ({attachments.length})
                    </h3>
                    <div className="space-y-3">
                      {attachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 hover:bg-accent/50 transition-colors">
                          <Paperclip className="h-6 w-6 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-foreground truncate" data-testid={`text-attachment-${index}`}>
                              {attachment.filename}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} МБ
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {isEditableAttachment(attachment.mimeType, attachment.filename) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditAttachment(attachment)}
                                disabled={isLoadingAttachment}
                                data-testid={`button-edit-attachment-${index}`}
                                title="Таҳрир дар муҳаррир"
                              >
                                <Edit className="h-5 w-5" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => handleDownload(attachment.id, attachment.filename)}
                              data-testid={`button-download-${index}`}
                              className="gap-2"
                            >
                              <Download className="h-5 w-5" />
                              {t.download}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {messageDocuments.length > 0 && (
                  <div className="space-y-4 pt-4 border-t px-6">
                    <h3 className="text-xl font-semibold text-foreground">
                      Ҳуҷҷатҳо ({messageDocuments.length})
                    </h3>
                    <div className="space-y-3">
                      {messageDocuments.map((doc, index) => (
                        <Card key={doc.id} className="overflow-hidden" data-testid={`document-card-${index}`}>
                          <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-green-600" />
                              <span className="font-medium">{doc.title}</span>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDocumentEditor(doc)}
                              data-testid={`button-edit-document-${index}`}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Таҳрир
                            </Button>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Document Editor Dialog */}
                <Dialog open={isDocumentEditorOpen} onOpenChange={(open) => {
                  if (!open) {
                    setIsDocumentEditorOpen(false);
                    setEditingDocument(null);
                    setEditedContent('');
                  }
                }}>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Таҳрири ҳуҷҷат: {editingDocument?.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto min-h-[400px]">
                      <DocumentEditor
                        content={editedContent}
                        onChange={setEditedContent}
                        departmentName={user?.userType === 'department' ? user.department?.name : undefined}
                        canApprove={user?.userType === 'department' ? user.department?.canApprove : false}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDocumentEditorOpen(false);
                          setEditingDocument(null);
                          setEditedContent('');
                        }}
                        data-testid="button-cancel-edit-document"
                      >
                        Бекор кардан
                      </Button>
                      <Button
                        onClick={handleSaveDocument}
                        disabled={updateDocumentMutation.isPending}
                        className="gap-1"
                        data-testid="button-save-document"
                      >
                        <Save className="h-4 w-4" />
                        {updateDocumentMutation.isPending ? 'Сабт истодааст...' : 'Сабт кардан'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Attachment Editor Dialog */}
                <Dialog open={isAttachmentEditorOpen} onOpenChange={(open) => {
                  if (!open) {
                    setIsAttachmentEditorOpen(false);
                    setEditingAttachment(null);
                    setAttachmentContent('');
                  }
                }}>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-green-600" />
                        Таҳрири файл: {editingAttachment?.filename}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto min-h-[400px]">
                      <DocumentEditor
                        content={attachmentContent}
                        onChange={setAttachmentContent}
                        departmentName={user?.userType === 'department' ? user.department?.name : undefined}
                        canApprove={user?.userType === 'department' ? user.department?.canApprove : false}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAttachmentEditorOpen(false);
                          setEditingAttachment(null);
                          setAttachmentContent('');
                        }}
                        data-testid="button-cancel-edit-attachment"
                      >
                        Бекор кардан
                      </Button>
                      <Button
                        onClick={handleSaveAttachmentAsDocument}
                        className="gap-1"
                        data-testid="button-save-attachment-as-document"
                      >
                        <Save className="h-4 w-4" />
                        Сабт ҳамчун ҳуҷҷат
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {user?.userType === 'department' && (
                  <div className="pt-4 border-t flex flex-wrap justify-between gap-3 px-6">
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleReply} data-testid="button-reply" className="gap-1 h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                        <Reply className="h-4 w-4" />
                        {t.reply}
                      </Button>
                      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-forward" className="gap-1 h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                            <Forward className="h-4 w-4" />
                            Фиристодан
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ҳуҷҷатро ба шуъба фиристодан</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Шуъба</Label>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const availableDepts = departments.filter(dept => 
                                      dept.id !== user?.department?.id && !dept.parentDepartmentId
                                    );
                                    if (forwardRecipientIds.length === availableDepts.length) {
                                      setForwardRecipientIds([]);
                                    } else {
                                      setForwardRecipientIds(availableDepts.map(dept => dept.id));
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm h-8 px-3"
                                  data-testid="button-select-all-forward"
                                >
                                  {forwardRecipientIds.length === departments.filter(dept => 
                                    dept.id !== user?.department?.id && !dept.parentDepartmentId
                                  ).length
                                    ? 'Бекор кардан'
                                    : 'Ҳамаро қайд кардан'}
                                </Button>
                              </div>
                              <Input
                                placeholder="Ҷустуҷӯи шуъба..."
                                value={forwardSearchQuery}
                                onChange={(e) => setForwardSearchQuery(e.target.value)}
                                data-testid="input-forward-search"
                              />
                              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                                {departments
                                  .filter(dept => dept.id !== user?.department?.id && !dept.parentDepartmentId)
                                  .filter(dept => !forwardSearchQuery || dept.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()))
                                  .map(dept => (
                                    <div key={dept.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                      <Checkbox
                                        id={`forward-dept-${dept.id}`}
                                        checked={forwardRecipientIds.includes(dept.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setForwardRecipientIds([...forwardRecipientIds, dept.id]);
                                          } else {
                                            setForwardRecipientIds(forwardRecipientIds.filter(id => id !== dept.id));
                                          }
                                        }}
                                        data-testid={`checkbox-forward-recipient-${dept.id}`}
                                      />
                                      <Label 
                                        htmlFor={`forward-dept-${dept.id}`} 
                                        className="flex-1 cursor-pointer text-base"
                                      >
                                        {dept.name}
                                      </Label>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsForwardDialogOpen(false);
                                  setForwardRecipientIds([]);
                                  setForwardSearchQuery('');
                                }}
                                data-testid="button-cancel-forward"
                              >
                                Бекор кардан
                              </Button>
                              <Button
                                onClick={() => forwardMessageMutation.mutate()}
                                disabled={forwardRecipientIds.length === 0 || forwardMessageMutation.isPending}
                                data-testid="button-submit-forward"
                              >
                                {forwardMessageMutation.isPending ? 'Фиристода истодааст...' : 'Фиристодан'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {user.department?.canCreateAssignmentFromMessage && (
                      <Dialog open={isAssignmentDialogOpen} onOpenChange={(open) => {
                        setIsAssignmentDialogOpen(open);
                        if (!open) setShowAllInvited(false);
                      }}>
                        <DialogTrigger asChild>
                          <Button onClick={openAssignmentDialog} data-testid="button-create-assignment" className="gap-1 h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                            <FileText className="h-4 w-4" />
                            Вазифагузорӣ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Супориш</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Намуди ҳуҷҷат <span className="text-destructive">*</span></Label>
                              <Select 
                                value={assignmentDocumentTypeId} 
                                onValueChange={setAssignmentDocumentTypeId}
                              >
                                <SelectTrigger data-testid="select-assignment-document-type">
                                  <SelectValue placeholder="Намуди ҳуҷҷатро интихоб кунед" />
                                </SelectTrigger>
                                <SelectContent>
                                  {documentTypes.map((docType) => (
                                    <SelectItem 
                                      key={docType.id} 
                                      value={docType.id.toString()}
                                    >
                                      {docType.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Мазмун</Label>
                              <Textarea
                                value={assignmentContent}
                                onChange={(e) => setAssignmentContent(e.target.value)}
                                placeholder="Шарҳи иловагӣ..."
                                className="min-h-[120px]"
                                data-testid="textarea-assignment-content"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="assignment-doc-number">
                                Рақами ҳуҷҷат
                              </Label>
                              <Input
                                id="assignment-doc-number"
                                value={assignmentDocNumber}
                                onChange={(e) => setAssignmentDocNumber(e.target.value)}
                                placeholder="Рақами ҳуҷҷат"
                                data-testid="input-assignment-doc-number"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <Label>Қабулкунандагон</Label>
                                {!loadingDepartments && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const myDeptId = user?.department?.id;
                                      const myParentId = user?.department?.parentDepartmentId;
                                      const filteredDepts = departments.filter((dept: any) => {
                                        if (!dept.parentDepartmentId) return true;
                                        return dept.parentDepartmentId === myDeptId || 
                                               (myParentId && dept.parentDepartmentId === myParentId);
                                      });
                                      const allDeptIds = filteredDepts.map((dept: any) => dept.id);
                                      if (selectedRecipients.length === allDeptIds.length) {
                                        setSelectedRecipients([]);
                                      } else {
                                        setSelectedRecipients(allDeptIds);
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    data-testid="button-select-all-recipients"
                                  >
                                    {(() => {
                                      const myDeptId = user?.department?.id;
                                      const myParentId = user?.department?.parentDepartmentId;
                                      const filteredDepts = departments.filter((dept: any) => {
                                        if (!dept.parentDepartmentId) return true;
                                        return dept.parentDepartmentId === myDeptId || 
                                               (myParentId && dept.parentDepartmentId === myParentId);
                                      });
                                      return selectedRecipients.length === filteredDepts.length
                                        ? 'Бекор кардан'
                                        : 'Ҳамаро қайд кардан';
                                    })()}
                                  </Button>
                                )}
                              </div>
                              {loadingDepartments ? (
                                <div className="text-sm text-muted-foreground">Боргирӣ...</div>
                              ) : (
                                <div>
                                  <Input
                                    placeholder="Ҷустуҷӯ..."
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                    className="mb-2"
                                    data-testid="input-recipient-search"
                                  />
                                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {departments
                                        .filter((dept: any) => {
                                          const myDeptId = user?.department?.id;
                                          const myParentId = user?.department?.parentDepartmentId;
                                          if (!dept.parentDepartmentId) return true;
                                          return dept.parentDepartmentId === myDeptId || 
                                                 (myParentId && dept.parentDepartmentId === myParentId);
                                        })
                                        .filter((dept: any) => 
                                          !recipientSearch || dept.name.toLowerCase().includes(recipientSearch.toLowerCase())
                                        )
                                        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                                        .map((dept: any) => (
                                          <div key={dept.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`recipient-${dept.id}`}
                                              checked={selectedRecipients.includes(dept.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedRecipients([...selectedRecipients, dept.id]);
                                                } else {
                                                  setSelectedRecipients(selectedRecipients.filter(id => id !== dept.id));
                                                  const deptPeopleIds = allPeople.filter(p => p.departmentId === dept.id).map(p => p.id);
                                                  setSelectedExecutorIds(selectedExecutorIds.filter(id => !deptPeopleIds.includes(id)));
                                                }
                                              }}
                                              data-testid={`checkbox-recipient-${dept.id}`}
                                            />
                                            <label htmlFor={`recipient-${dept.id}`} className="text-sm cursor-pointer">{dept.name}</label>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </div>
                              )}
                              {selectedRecipients.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Интихоб шуд: {selectedRecipients.length}
                                </p>
                              )}
                            </div>

                            {/* Даъват (Приглашенные) - только ПЕРВЫЙ выбранный человек */}
                            {selectedExecutorIds.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Даъват</Label>
                                  <span className="text-xs text-muted-foreground">
                                    Интихоб шуд: {selectedExecutorIds.length}
                                  </span>
                                </div>
                                <div className="border rounded-md p-4">
                                  <div className="space-y-2">
                                    {(() => {
                                      // Только первый выбранный человек в Даъват
                                      const firstPerson = allPeople.find(p => p.id === selectedExecutorIds[0]);
                                      if (!firstPerson) return null;
                                      const dept = departments.find(d => d.id === firstPerson.departmentId);
                                      
                                      return (
                                        <div className="flex items-center justify-between space-x-2 py-1">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Checkbox
                                              id={`invited-${firstPerson.id}`}
                                              checked={true}
                                              onCheckedChange={() => {
                                                setSelectedExecutorIds(selectedExecutorIds.filter(id => id !== firstPerson.id));
                                              }}
                                              data-testid={`checkbox-invited-${firstPerson.id}`}
                                            />
                                            <label htmlFor={`invited-${firstPerson.id}`} className="text-sm cursor-pointer flex-1">
                                              {firstPerson.name}
                                            </label>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {dept?.name || 'Номаълум'}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Иҷрокунандагон (Исполнители) - показывает всех людей, кроме первого выбранного (который в Даъват) */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Иҷрокунандагон</Label>
                                {selectedRecipients.length > 0 && (() => {
                                  // Первый выбранный человек (в Даъват) исключен из списка
                                  const firstSelectedId = selectedExecutorIds[0];
                                  const allAvailablePeople = allPeople.filter(p => 
                                    selectedRecipients.includes(p.departmentId!) && p.id !== firstSelectedId && !selectedExecutorIds.includes(p.id)
                                  );
                                  if (allAvailablePeople.length <= 1) return null;
                                  return (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const allPeopleIds = allPeople
                                          .filter(p => selectedRecipients.includes(p.departmentId!) && p.id !== firstSelectedId)
                                          .map(p => p.id);
                                        setSelectedExecutorIds(Array.from(new Set([...selectedExecutorIds, ...allPeopleIds])));
                                      }}
                                      className="text-xs h-7"
                                      data-testid="button-select-all-executors"
                                    >
                                      Ҳамаро интихоб кардан
                                    </Button>
                                  );
                                })()}
                              </div>
                              {selectedRecipients.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Аввал қабулкунандаро интихоб кунед
                                </p>
                              ) : (
                                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                  {selectedRecipients.map(recipientId => {
                                    const dept = departments.find(d => d.id === recipientId);
                                    // Первый выбранный человек показывается в Даъват, не здесь
                                    const firstSelectedId = selectedExecutorIds[0];
                                    const peopleInDept = allPeople.filter(p => 
                                      p.departmentId === recipientId && p.id !== firstSelectedId
                                    );
                                    
                                    if (peopleInDept.length === 0) return null;
                                    
                                    return (
                                      <div key={recipientId} className="mb-4 last:mb-0">
                                        <div className="text-sm font-semibold text-gray-700 mb-2">
                                          {dept?.name || 'Номаълум'}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                          {peopleInDept.map(person => {
                                            // Чекбокс отмечен если человек выбран (кроме первого)
                                            const isChecked = selectedExecutorIds.includes(person.id);
                                            return (
                                              <div key={person.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`executor-${person.id}`}
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      setSelectedExecutorIds([...selectedExecutorIds, person.id]);
                                                    } else {
                                                      setSelectedExecutorIds(selectedExecutorIds.filter(id => id !== person.id));
                                                    }
                                                  }}
                                                  data-testid={`checkbox-executor-${person.id}`}
                                                />
                                                <label htmlFor={`executor-${person.id}`} className="text-sm cursor-pointer">
                                                  {person.name}
                                                </label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {allPeople.filter(p => p.departmentId !== null && selectedRecipients.includes(p.departmentId) && p.id !== selectedExecutorIds[0]).length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Иҷрокунандае дар ин шуъбаҳо нест
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Мӯҳлати иҷро то:</Label>
                              <DatePicker
                                value={assignmentDeadline}
                                onChange={setAssignmentDeadline}
                                placeholder="Санаро интихоб кунед"
                                data-testid="datepicker-assignment-deadline"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Файлҳо</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => document.getElementById('assignment-file-input-modal')?.click()}
                                  className="gap-2"
                                  data-testid="button-select-assignment-files"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  Интихоби файл
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {assignmentFiles.length > 0 && `${assignmentFiles.length} файл`}
                                </span>
                              </div>
                              <input
                                id="assignment-file-input-modal"
                                type="file"
                                multiple
                                accept="*/*"
                                className="hidden"
                                onChange={handleFileSelect}
                              />
                              {assignmentFiles.length > 0 && (
                                <div className="space-y-2 mt-2">
                                  {assignmentFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm truncate flex-1">{file.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                                Бекор кардан
                              </Button>
                              <Button onClick={handleSubmitAssignment} disabled={createAssignmentMutation.isPending}>
                                {createAssignmentMutation.isPending
                                  ? 'Эҷод шуда истодааст...'
                                  : 'Эҷод кардан'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Stamp buttons - only for recipients with canApprove permission - inline with action buttons */}
                    {user.department?.canApprove && 
                     !message.approvalStatus &&
                     (message.recipientId === user.department.id || 
                      (message.recipientIds && message.recipientIds.includes(user.department.id))) && (
                      <StampButtons
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isPending={approvalMutation.isPending}
                      />
                    )}
                  </div>
                )}
                  
                {/* Show stamp if already approved/rejected */}
                {(message.approvalStatus === 'approved' || message.approvalStatus === 'rejected') && (
                  <div className="mt-6 pt-6 border-t px-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Мӯҳри расмӣ:</h4>
                    <DocumentStamp
                      status={message.approvalStatus as 'approved' | 'rejected'}
                      departmentName={
                        departments.find((d: Department) => d.id === message.approvedById)?.name || 
                        (user?.userType === 'department' ? user.department?.name : '') || 
                        'Департамент'
                      }
                      approvedAt={message.approvedAt}
                      size="lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
