import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, buildApiUrl } from '@/lib/api-config';
import ImageCropDialog from '@/components/ImageCropDialog';

interface DepartmentIconUploadProps {
  departmentId: number | null;
  onUploadSuccess?: () => void;
}

export default function DepartmentIconUpload({ departmentId, onUploadSuccess }: DepartmentIconUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [iconVersion, setIconVersion] = useState(0);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch current icon if department exists - use iconVersion for cache-busting only after upload
  const currentIconUrl = departmentId ? buildApiUrl(`/api/departments/${departmentId}/icon?v=${iconVersion}`) : null;

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

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Хатогӣ',
        description: 'Андозаи файл бояд аз 10 МБ зиёд набошад.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL for crop dialog
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageUrl(reader.result as string);
      setShowCropDialog(true); // Open crop dialog instead of auto-upload
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (blob: Blob) => {
    if (!departmentId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('icon', blob, 'icon.png');

      const response = await apiFetch(`/api/departments/${departmentId}/icon`, {
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
      setOriginalImageUrl(null);
      setIconVersion(v => v + 1);
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

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Revoke previous object URL to prevent memory leak
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create preview from cropped blob
    const newPreviewUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(newPreviewUrl);
    
    // Auto-upload cropped image
    await uploadFile(croppedBlob);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOriginalImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {showCropDialog && originalImageUrl && (
        <ImageCropDialog
          open={showCropDialog}
          onClose={() => {
            setShowCropDialog(false);
            setOriginalImageUrl(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          imageSrc={originalImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
      
      <div className="space-y-4">
        {/* Current icon or preview */}
        <div className="flex items-center gap-4">
        <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
          ) : currentIconUrl && departmentId ? (
            <img 
              src={currentIconUrl} 
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
          </div>
          
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, GIF ё WebP. Ҳадди аксар 1 MB.
          </p>
        </div>
        </div>
      </div>
    </>
  );
}
