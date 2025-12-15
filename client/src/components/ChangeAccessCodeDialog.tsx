import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Key, Loader2 } from 'lucide-react';

interface ChangeAccessCodeDialogProps {
  currentCode?: string;
  onSuccess?: (newCode: string) => void;
}

export function ChangeAccessCodeDialog({ currentCode, onSuccess }: ChangeAccessCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('PATCH', '/api/departments/self/access-code', {
        newAccessCode: code,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Рамз иваз карда шуд',
        description: 'Рамзи нави шумо: ' + data.accessCode,
      });
      setOpen(false);
      setNewAccessCode('');
      setConfirmCode('');
      onSuccess?.(data.accessCode);
    },
    onError: (error: Error) => {
      toast({
        title: 'Хатогӣ',
        description: error.message || 'Иваз кардани рамз ба анҷом нарасид',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccessCode.trim()) {
      toast({
        title: 'Хатогӣ',
        description: 'Рамзи навро ворид кунед',
        variant: 'destructive',
      });
      return;
    }

    if (newAccessCode.length < 4) {
      toast({
        title: 'Хатогӣ',
        description: 'Рамз бояд ҳадди аққал 4 ҳарф дошта бошад',
        variant: 'destructive',
      });
      return;
    }

    if (newAccessCode !== confirmCode) {
      toast({
        title: 'Хатогӣ',
        description: 'Рамзҳо мувофиқат намекунанд',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate(newAccessCode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          data-testid="button-change-access-code"
          className="bg-red-500 text-white hover:bg-red-600 h-11 w-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Key className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Иваз кардани рамз</DialogTitle>
          <DialogDescription>
            Рамзи навро ворид кунед. Рамзи нав дар ҳамаи ҷойҳо иваз мешавад.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {currentCode && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Рамзи ҳозира</Label>
                <div className="px-3 py-2 bg-muted rounded-md font-mono text-sm">
                  {currentCode}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="newCode">Рамзи нав</Label>
              <Input
                id="newCode"
                type="text"
                value={newAccessCode}
                onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
                placeholder="Рамзи навро ворид кунед"
                data-testid="input-new-access-code"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmCode">Такрори рамзи нав</Label>
              <Input
                id="confirmCode"
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                placeholder="Рамзро такрор кунед"
                data-testid="input-confirm-access-code"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-change-code"
            >
              Бекор кардан
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-testid="button-save-access-code"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нигоҳдорӣ...
                </>
              ) : (
                'Нигоҳ доштан'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
