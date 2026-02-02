import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileIcon, Download, Trash2, X, CheckCircle2 } from 'lucide-react';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import logoImage from '@assets/logo-optimized.webp';
import bgImage from '@assets/eco-background-light.webp';

interface DepartmentFile {
  id: number;
  departmentId: number;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedById: number | null;
  createdAt: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  isUploading: boolean;
  isComplete: boolean;
}

export default function MubodilaPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const departmentId = user?.userType === 'department' ? user.department?.id : null;

  const { data: files = [], isLoading } = useQuery<DepartmentFile[]>({
    queryKey: ['/api/department-files', departmentId],
    enabled: !!departmentId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/department-files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/department-files', departmentId] });
      toast({
        title: 'Файл нест карда шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хатогӣ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFilesSelect = (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);
    
    const newFiles: UploadingFile[] = filesArray.map(file => ({
      file,
      progress: 0,
      isUploading: false,
      isComplete: false,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    setTimeout(() => {
      uploadFiles(newFiles);
    }, 100);
  };

  const uploadFiles = async (filesToUpload: UploadingFile[]) => {
    for (const uploadedFile of filesToUpload) {
      await uploadSingleFile(uploadedFile);
    }
  };

  const uploadSingleFile = async (uploadedFile: UploadingFile) => {
    if (!departmentId) return;

    setUploadingFiles(prev => {
      const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
      if (fileIndex === -1) return prev;
      const updated = [...prev];
      updated[fileIndex] = { ...updated[fileIndex], isUploading: true, progress: 0 };
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadingFiles(prev => {
              const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
              if (fileIndex === -1) return prev;
              const updated = [...prev];
              updated[fileIndex] = { ...updated[fileIndex], progress };
              return updated;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `/api/department-files/${departmentId}`);
        xhr.send(formData);
      });

      setUploadingFiles(prev => {
        const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
        if (fileIndex === -1) return prev;
        const updated = [...prev];
        updated[fileIndex] = {
          ...updated[fileIndex],
          isUploading: false,
          isComplete: true,
          progress: 100,
        };
        return updated;
      });

      queryClient.invalidateQueries({ queryKey: ['/api/department-files', departmentId] });

      toast({
        title: 'Файл бор карда шуд',
        description: uploadedFile.file.name,
      });

      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== uploadedFile.file));
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);

      setUploadingFiles(prev => {
        const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
        if (fileIndex === -1) return prev;
        const updated = [...prev];
        updated[fileIndex] = { ...updated[fileIndex], isUploading: false, progress: 0 };
        return updated;
      });

      toast({
        title: 'Хатои боргузорӣ',
        description: `${uploadedFile.file.name}: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemoveUpload = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1024 / 1024).toFixed(2) + ' МБ';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tg-TJ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const anyUploading = uploadingFiles.some(f => f.isUploading);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative flex flex-col"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.92)' }} />
      
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 min-w-0 flex-1 md:flex-initial">
            <button 
              onClick={() => setLocation('/department/main')}
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white shrink-0" />
              <img src={logoImage} alt="Логотип" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">
                  Мубодила
                </h1>
                <p className="text-xs text-white/90 drop-shadow-sm truncate">Захираи ҳуҷҷатҳо</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 relative z-10 flex-1">
        <div className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Боргузории файл
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  data-testid="input-file-upload"
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex cursor-pointer items-center justify-center rounded-lg 
                    border-2 border-dashed px-6 py-12 text-center 
                    hover-elevate transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}
                  `}
                  data-testid="dropzone-file-upload"
                >
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Файлҳоро интихоб кунед ё ин ҷо кашед</p>
                    <p className="text-xs text-muted-foreground">Ҳар гуна ҳуҷҷат ва файлҳо</p>
                  </div>
                </div>

                {uploadingFiles.length > 0 && (
                  <div className="space-y-3">
                    {uploadingFiles.map((uploadedFile, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                          <FileIcon className="h-6 w-6 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{uploadedFile.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                          </div>
                          
                          {uploadedFile.isComplete && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUpload(index)}
                            disabled={uploadedFile.isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Progress 
                            value={uploadedFile.progress} 
                            className={`h-2 ${uploadedFile.isComplete ? 'bg-primary/20' : ''}`}
                          />
                          <p className="text-xs text-center text-muted-foreground">
                            {uploadedFile.isComplete 
                              ? 'Бор шуд' 
                              : uploadedFile.isUploading 
                                ? `Бор мешавад... ${uploadedFile.progress}%`
                                : 'Дар навбат...'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-primary" />
                Файлҳои захирашуда ({files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ҳоло файле нест. Файлҳоро дар болои саҳифа бор кунед.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <FileIcon className="h-8 w-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.originalFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-download-${file.id}`}
                        >
                          <a href={`/api/department-files/download/${file.id}`} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(file.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${file.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
