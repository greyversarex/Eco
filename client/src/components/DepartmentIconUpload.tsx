import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepartmentIconUploadProps {
  departmentId: number | null;
  onUploadSuccess?: () => void;
}

export default function DepartmentIconUpload({ departmentId, onUploadSuccess }: DepartmentIconUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch current icon if department exists
  const currentIconUrl = departmentId ? `/api/departments/${departmentId}/icon` : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Хатогӣ',
        description: 'Танҳо файлҳои тасвирӣ (PNG, JPEG, GIF, WebP) мутаносибанд.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Хатогӣ',
        description: 'Андозаи файл бояд аз 5 МБ зиёд набошад.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload immediately if department exists
    if (departmentId) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!departmentId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('icon', file);

      const response = await fetch(`/api/departments/${departmentId}/icon`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Хатогӣ ҳангоми боргузорӣ');
      }

      toast({
        title: 'Муваффақият',
        description: 'Иконка бомуваффақият боргузорӣ шуд.',
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploadSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Хатогӣ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadFile(selectedFile);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current icon or preview */}
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
          ) : currentIconUrl && departmentId ? (
            <img 
              src={`${currentIconUrl}?t=${Date.now()}`} 
              alt="Current icon" 
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                // If image fails to load, hide it
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-department-icon-file"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="button-select-icon-file"
            >
              <Upload className="w-4 h-4 mr-2" />
              Интихоби файл
            </Button>
            
            {selectedFile && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading || !departmentId}
                  data-testid="button-upload-icon"
                >
                  {isUploading ? 'Боргузорӣ...' : 'Боргузорӣ'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                  data-testid="button-cancel-icon-upload"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, GIF ё WebP. Ҳадди аксар 1 MB.
          </p>
        </div>
      </div>
    </div>
  );
}
