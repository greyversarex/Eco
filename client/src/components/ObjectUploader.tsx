import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ObjectUploaderProps {
  onUploadComplete?: (uploadUrl: string, filename: string) => void;
  accept?: string;
  maxSizeMB?: number;
  language?: 'tg' | 'ru';
}

interface UploadResult {
  uploadURL: string;
}

export default function ObjectUploader({
  onUploadComplete,
  accept,
  maxSizeMB = 100,
  language = 'tg',
}: ObjectUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const translations = {
    tg: {
      selectFile: 'Интихоби файл',
      dragDrop: 'Файлро ба ин ҷо кашида андозед ё клик кунед',
      uploading: 'Бор мешавад...',
      uploadComplete: 'Бор шуд',
      remove: 'Хориҷ кардан',
      error: 'Хатои бор кардан',
      fileTooLarge: 'Андозаи файл аз {maxSize}МБ зиёд аст',
      uploadFailed: 'Бор кардан ноком шуд',
    },
    ru: {
      selectFile: 'Выбрать файл',
      dragDrop: 'Перетащите файл сюда или нажмите',
      uploading: 'Загрузка...',
      uploadComplete: 'Загружено',
      remove: 'Удалить',
      error: 'Ошибка загрузки',
      fileTooLarge: 'Размер файла превышает {maxSize}МБ',
      uploadFailed: 'Загрузка не удалась',
    },
  };

  const t = translations[language];

  // Get presigned URL from backend
  const getUploadUrlMutation = useMutation<UploadResult>({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/objects/upload');
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      toast({
        title: t.error,
        description: t.fileTooLarge.replace('{maxSize}', maxSizeMB.toString()),
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
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

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const { uploadURL } = await getUploadUrlMutation.mutateAsync();

      // Step 2: Upload file directly to cloud storage using presigned URL
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadComplete(true);
          setIsUploading(false);
          
          // Extract the file URL from the presigned URL
          const fileUrl = uploadURL.split('?')[0];
          
          // Notify parent component
          if (onUploadComplete) {
            onUploadComplete(fileUrl, file.name);
          }

          toast({
            title: t.uploadComplete,
            description: file.name,
          });
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.open('PUT', uploadURL);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: t.error,
        description: error.message || t.uploadFailed,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!file) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
        <FileIcon className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} МБ
          </p>
        </div>
        
        {uploadComplete && (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" data-testid="icon-upload-complete" />
        )}
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveFile}
          disabled={isUploading}
          data-testid="button-remove-file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} data-testid="progress-upload" />
          <p className="text-xs text-center text-muted-foreground">
            {t.uploading} {uploadProgress}%
          </p>
        </div>
      )}

      {!uploadComplete && !isUploading && (
        <Button
          type="button"
          onClick={uploadFile}
          className="w-full"
          data-testid="button-upload"
        >
          <Upload className="h-4 w-4 mr-2" />
          {t.selectFile}
        </Button>
      )}
    </div>
  );
}
