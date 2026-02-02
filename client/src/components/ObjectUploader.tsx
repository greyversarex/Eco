import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ObjectUploaderProps {
  messageId: number;
  onUploadComplete?: (attachmentId: number, filename: string) => void;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  language?: 'tg' | 'ru';
}

interface UploadedFile {
  file: File;
  attachmentId?: number;
  progress: number;
  isUploading: boolean;
  isComplete: boolean;
}

export default function ObjectUploader({
  messageId,
  onUploadComplete,
  accept,
  maxSizeMB = Infinity,
  maxFiles = Infinity,
  language = 'tg',
}: ObjectUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const translations = {
    tg: {
      selectFile: 'Бор кардан',
      dragDrop: 'Ҳуҷҷатро интихоб кунед',
      uploading: 'Бор мешавад...',
      uploadComplete: 'Бор шуд',
      remove: 'Хориҷ кардан',
      error: 'Хатои бор кардан',
      fileTooLarge: 'Андозаи файл аз {maxSize}МБ зиёд аст',
      uploadFailed: 'Бор кардан ноком шуд',
      maxFilesReached: 'Шумо метавонед танҳо {maxFiles} файл бор кунед',
      addMore: 'Боз илова кунед',
    },
    ru: {
      selectFile: 'Загрузить',
      dragDrop: 'Выберите файлы',
      uploading: 'Загрузка...',
      uploadComplete: 'Загружено',
      remove: 'Удалить',
      error: 'Ошибка загрузки',
      fileTooLarge: 'Размер файла превышает {maxSize}МБ',
      uploadFailed: 'Загрузка не удалась',
      maxFilesReached: 'Вы можете загрузить только {maxFiles} файлов',
      addMore: 'Добавить еще',
    },
  };

  const t = translations[language];

  const handleFilesSelect = (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);

    // All files are valid - no limits
    const validFiles: File[] = filesArray;

    // Add files to upload queue
    if (validFiles.length > 0) {
      const newFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        progress: 0,
        isUploading: false,
        isComplete: false,
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Start uploading immediately
      setTimeout(() => {
        uploadFiles(newFiles);
      }, 100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
      // Reset input
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

  const uploadFiles = async (filesToUpload: UploadedFile[]) => {
    for (const uploadedFile of filesToUpload) {
      await uploadSingleFile(uploadedFile);
    }
  };

  const uploadSingleFile = async (uploadedFile: UploadedFile) => {
    // Mark as uploading
    setUploadedFiles(prev => {
      const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
      if (fileIndex === -1) return prev;
      const updated = [...prev];
      updated[fileIndex] = { ...updated[fileIndex], isUploading: true, progress: 0 };
      return updated;
    });

    try {
      // Upload file to database via API
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      const response = await new Promise<{ id: number; filename: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadedFiles(prev => {
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
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `/api/messages/${messageId}/attachments`);
        xhr.send(formData);
      });

      // Mark as complete
      setUploadedFiles(prev => {
        const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
        if (fileIndex === -1) return prev;
        const updated = [...prev];
        updated[fileIndex] = {
          ...updated[fileIndex],
          attachmentId: response.id,
          isUploading: false,
          isComplete: true,
          progress: 100,
        };
        return updated;
      });

      if (onUploadComplete) {
        onUploadComplete(response.id, response.filename);
      }

      toast({
        title: t.uploadComplete,
        description: uploadedFile.file.name,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Mark as failed
      setUploadedFiles(prev => {
        const fileIndex = prev.findIndex(f => f.file === uploadedFile.file);
        if (fileIndex === -1) return prev;
        const updated = [...prev];
        updated[fileIndex] = { ...updated[fileIndex], isUploading: false, progress: 0 };
        return updated;
      });
      
      toast({
        title: t.error,
        description: `${uploadedFile.file.name}: ${error.message || t.uploadFailed}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const anyUploading = uploadedFiles.some(f => f.isUploading);

  return (
    <div className="space-y-4">
      {uploadedFiles.length === 0 ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            multiple
            data-testid="input-file-upload"
          />
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex cursor-pointer items-center justify-center rounded-md 
              border-2 border-dashed px-6 py-12 text-center 
              hover-elevate transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}
            `}
            data-testid="dropzone-file-upload"
          >
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.dragDrop}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {uploadedFiles.map((uploadedFile, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
                <FileIcon className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} МБ
                  </p>
                </div>
                
                {uploadedFile.isComplete && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" data-testid="icon-upload-complete" />
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploadedFile.isUploading}
                  data-testid={`button-remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <Progress 
                  value={uploadedFile.progress} 
                  className={`h-3 ${uploadedFile.isComplete ? 'bg-primary/20' : ''}`}
                  data-testid={`progress-upload-${index}`} 
                />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadedFile.isComplete 
                    ? (language === 'tg' ? 'Бор шуд' : 'Загружено') 
                    : uploadedFile.isUploading 
                      ? `${t.uploading} ${uploadedFile.progress}%`
                      : (language === 'tg' ? 'Дар навбат...' : 'В очереди...')
                  }
                </p>
              </div>
            </div>
          ))}

          {!anyUploading && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={accept}
                multiple
                data-testid="input-file-upload-more"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-add-more"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t.addMore}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
