import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MessageListItem from '@/components/MessageListItem';
import { t } from '@/lib/i18n';
import { ArrowLeft, Trash2, LogOut, Search } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Message, Department, DocumentType } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { apiFetch } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';

export default function Inbox() {
  const [location, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const isOutbox = location === '/department/outbox';
  const pageTitle = isOutbox ? t.outbox : t.inbox;

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/all'],
  });

  const { data: documentTypes = [] } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types'],
  });

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '';
  };

  const filteredMessages = useMemo(() => {
    if (!user || user.userType !== 'department') return [];
    if (!Array.isArray(messages)) return [];
    
    const currentDeptId = user.department.id;
    
    if (isOutbox) {
      return messages.filter(msg => msg.senderId === currentDeptId);
    } else {
      // Inbox: check both legacy recipientId and new recipientIds array
      return messages.filter(msg => 
        msg.recipientId === currentDeptId || 
        msg.recipientIds?.includes(currentDeptId)
      );
    }
  }, [messages, user, isOutbox]);

  const formattedMessages = useMemo(() => {
    return filteredMessages.map(msg => {
      let senderName = '';
      let recipientNames: string[] = [];
      
      if (isOutbox) {
        // Outbox: show recipient(s)
        if (msg.recipientIds && msg.recipientIds.length > 0) {
          // Broadcast message - show all recipients
          recipientNames = msg.recipientIds.map((id: number) => getDepartmentName(id)).filter((name: string) => name);
        } else if (msg.recipientId) {
          // Legacy single recipient
          const name = getDepartmentName(msg.recipientId);
          recipientNames = name ? [name] : [];
        } else if (msg.recipientId === null) {
          // Broadcast to all departments
          recipientNames = ['Ҳама шуъбаҳо'];
        }
        senderName = recipientNames.join(', '); // Fallback for search
      } else {
        // Inbox: show sender
        if (msg.senderId === null) {
          senderName = 'Системавӣ';
        } else {
          const name = getDepartmentName(msg.senderId);
          senderName = name || 'Номаълум';
        }
      }
      
      return {
        id: msg.id.toString(),
        subject: msg.subject,
        sender: senderName,
        recipientNames: recipientNames.length > 0 ? recipientNames : undefined,
        date: format(new Date(msg.documentDate), 'd. M. yyyy'),
        isRead: msg.isRead,
        hasAttachment: !!msg.attachmentUrl,
        isSentMessage: isOutbox,
        documentNumber: msg.documentNumber || '',
        svNumber: (msg as any).svNumber || undefined,
        svDirection: (msg as any).svDirection || undefined,
        content: msg.content || '',
        approvalStatus: msg.approvalStatus as 'approved' | 'rejected' | null,
      };
    });
  }, [filteredMessages, isOutbox, departments]);

  const searchedMessages = useMemo(() => {
    let result = formattedMessages;
    
    // Filter by document type
    if (documentTypeFilter && documentTypeFilter !== 'all') {
      const selectedType = documentTypes.find(dt => dt.id.toString() === documentTypeFilter);
      if (selectedType) {
        result = result.filter(msg => msg.subject === selectedType.name);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(msg => 
        msg.subject.toLowerCase().includes(query) ||
        msg.sender.toLowerCase().includes(query) ||
        msg.documentNumber.toLowerCase().includes(query) ||
        msg.content.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [formattedMessages, searchQuery, documentTypeFilter, documentTypes]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      return apiRequest('POST', '/api/messages/bulk-delete', { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      toast({
        title: 'Муваффақият',
        description: 'Паёмҳо бекор карда шуданд',
      });
    },
    onError: () => {
      toast({
        title: 'Хатогӣ',
        description: 'Хатогӣ ҳангоми бекор кардан',
        variant: 'destructive',
      });
    },
  });

  const handleToggleSelect = (messageId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === searchedMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(searchedMessages.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    const confirmMessage = `Шумо мутмаин ҳастед, ки мехоҳед ${selectedIds.size} паёмро бекор кунед?`;
    
    if (confirm(confirmMessage)) {
      const messageIds = Array.from(selectedIds).map(id => parseInt(id, 10));
      bulkDeleteMutation.mutate(messageIds);
    }
  };
  
  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedIds(new Set());
    }
  };

  const handleMessageClick = (messageId: string) => {
    const fromPath = isOutbox ? '/department/outbox' : '/department/inbox';
    setLocation(`/department/message/${messageId}?from=${fromPath}`);
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
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/department/main')}
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
                <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{pageTitle}</h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2">
              {!isDeleteMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleDeleteMode}
                  data-testid="button-toggle-delete"
                  className="gap-1 text-white hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Нест кардан
                  </span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                    data-testid="button-bulk-delete"
                    className="gap-1 text-white hover:bg-green-600/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Нест кардан {selectedIds.size > 0 && `(${selectedIds.size})`}
                    </span>
                    <span className="sm:hidden">{selectedIds.size > 0 && `(${selectedIds.size})`}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleDeleteMode}
                    data-testid="button-cancel-delete"
                    className="gap-1 text-white hover:bg-white/20"
                  >
                    Бекор кардан
                  </Button>
                </>
              )}
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
      <main className="mx-auto max-w-6xl relative z-10">
        <div className="border-x border-border bg-background/95 backdrop-blur-sm min-h-screen">
          <div className="p-4 border-b border-border bg-background/50">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ҷустуҷӯ дар паёмҳо..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-message-search"
                />
              </div>
              <Select
                value={documentTypeFilter}
                onValueChange={setDocumentTypeFilter}
              >
                <SelectTrigger className="w-48" data-testid="select-document-type-filter">
                  <SelectValue placeholder="Намуди ҳуҷҷат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ҳама</SelectItem>
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loadingMessages || loadingDepartments ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Боргирӣ...</p>
              </div>
            </div>
          ) : searchedMessages.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">
                {searchQuery.trim() ? 'Паёме ёфт нашуд' : 'Паёме нест'}
              </p>
            </div>
          ) : (
            <>
              {isDeleteMode && (
                <div className="border-b border-border px-4 py-2 bg-muted/30">
                  <Button
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                    className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0 font-medium shadow-sm"
                  >
                    {selectedIds.size === searchedMessages.length
                      ? 'Бекор кардани интихоб'
                      : 'Ҳамаро қайд кардан'}
                  </Button>
                </div>
              )}
              
              {/* Column Headers */}
              <div 
                className="hidden sm:grid border-b border-border px-6 py-3 bg-muted/30 font-semibold text-sm text-muted-foreground items-center gap-x-4"
                style={{
                  gridTemplateColumns: isDeleteMode 
                    ? 'auto 80px 120px 1fr 180px 130px 80px'
                    : '80px 120px 1fr 180px 130px 80px'
                }}
              >
                {isDeleteMode && <div />}
                
                {/* S/V Number Header */}
                <div className="text-center ml-[-1px] mr-[-1px]">
                  Рақами тартибӣ
                </div>
                
                {/* Document Number Header */}
                <div className="text-center">
                  Рақами ҳуҷҷат
                </div>
                
                {/* Subject Header */}
                <div className="min-w-0 pl-2">
                  Мавзӯъ ва мундариҷа
                </div>
                
                {/* Sender/Recipient Header */}
                <div className="pr-4">
                  {isOutbox ? 'Қабулкунанда' : 'Фиристанда'}
                </div>
                
                {/* Date Header */}
                <div className="pl-2">
                  Сана
                </div>
                
                {/* Icons Header */}
                <div />
              </div>

              {searchedMessages.map((message) => (
                <MessageListItem
                  key={message.id}
                  {...message}
                  onClick={() => handleMessageClick(message.id)}
                  selectable={isDeleteMode}
                  isSelected={selectedIds.has(message.id)}
                  onToggleSelect={() => handleToggleSelect(message.id)}
                />
              ))}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
