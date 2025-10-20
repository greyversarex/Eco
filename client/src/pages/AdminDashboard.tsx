import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { Building2, Mail, LogOut, Plus, Pencil, Trash2, RefreshCw, Leaf } from 'lucide-react';

// todo: remove mock functionality
const mockDepartments = [
  { id: '1', name: 'Раёсати Душанбе', block: 'upper', code: 'ABC123' },
  { id: '2', name: 'Агентии обухаводонимоси', block: 'upper', code: 'DEF456' },
  { id: '3', name: 'Сарраёсати Вилоҷи Суғд', block: 'upper', code: 'GHI789' },
  { id: '4', name: 'Раёсати мониторинги сифати экологӣ', block: 'middle', code: 'JKL012' },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [departments, setDepartments] = useState(mockDepartments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBlock, setNewDeptBlock] = useState('');
  const t = useTranslation(lang);

  const handleAddDepartment = () => {
    if (newDeptName && newDeptBlock) {
      const newDept = {
        id: String(departments.length + 1),
        name: newDeptName,
        block: newDeptBlock,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      };
      setDepartments([...departments, newDept]);
      console.log('Added department:', newDept);
      setNewDeptName('');
      setNewDeptBlock('');
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments(departments.filter((d) => d.id !== id));
    console.log('Deleted department:', id);
  };

  const handleGenerateCode = (id: string) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, code: newCode } : d))
    );
    console.log('Generated new code for department:', id, newCode);
  };

  const getBlockLabel = (block: string) => {
    if (block === 'upper') return t.upperBlock;
    if (block === 'middle') return t.middleBlock;
    return t.lowerBlock;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{t.adminPanel}</h1>
                <p className="text-xs text-muted-foreground">ЭкоТочикистон</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Admin logging out');
                  setLocation('/admin');
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.departments}</p>
                <p className="text-2xl font-semibold text-foreground">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.totalMessages}</p>
                <p className="text-2xl font-semibold text-foreground">247</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{t.departments}</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-department" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t.addDepartment}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addDepartment}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">{t.departmentName}</Label>
                    <Input
                      id="dept-name"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      data-testid="input-dept-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-block">{t.block}</Label>
                    <Select value={newDeptBlock} onValueChange={setNewDeptBlock}>
                      <SelectTrigger id="dept-block" data-testid="select-dept-block">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">{t.upperBlock}</SelectItem>
                        <SelectItem value="middle">{t.middleBlock}</SelectItem>
                        <SelectItem value="lower">{t.lowerBlock}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddDepartment} className="w-full" data-testid="button-save-department">
                    {t.addDepartment}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.departmentName}</TableHead>
                  <TableHead>{t.block}</TableHead>
                  <TableHead>{t.accessCode}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{getBlockLabel(dept.block)}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        {dept.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateCode(dept.id)}
                          data-testid={`button-generate-${dept.id}`}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Edit', dept.id)}
                          data-testid={`button-edit-${dept.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          data-testid={`button-delete-${dept.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
