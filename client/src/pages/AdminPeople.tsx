import { useState } from 'react';
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
  DialogDescription,
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
import { Building2, LogOut, Plus, Pencil, Trash2, Search, Users, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import type { Person, Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';

export default function AdminPeople() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonDepartmentId, setNewPersonDepartmentId] = useState<number | null>(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonDepartmentId, setEditPersonDepartmentId] = useState<number | null>(null);
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: allPeople = [], isLoading: isLoadingPeople } = useQuery<Person[]>({
    queryKey: ['/api/people'],
  });

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery<Department[]>({
    queryKey: ['/api/departments/list'],
  });

  const people = allPeople.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; departmentId: number | null }) => {
      return await apiRequest('POST', '/api/people', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      setNewPersonName('');
      setNewPersonDepartmentId(null);
      setIsAddDialogOpen(false);
      toast({
        title: 'Муваффақият',
        description: 'Иҷрокунанда илова шуд',
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; departmentId: number | null } }) => {
      return await apiRequest('PATCH', `/api/people/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      setIsEditDialogOpen(false);
      setEditingPerson(null);
      toast({
        title: 'Муваффақият',
        description: 'Иҷрокунанда навсозӣ шуд',
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/people/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      toast({
        title: 'Муваффақият',
        description: 'Иҷрокунанда бекор карда шуд',
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

  const handleAdd = () => {
    if (!newPersonName.trim()) {
      toast({
        title: 'Хато',
        description: 'Лутфан номи иҷрокунандаро ворид кунед',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate({ name: newPersonName, departmentId: newPersonDepartmentId });
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setEditPersonName(person.name);
    setEditPersonDepartmentId(person.departmentId);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPerson || !editPersonName.trim()) {
      toast({
        title: 'Хато',
        description: 'Лутфан номи иҷрокунандаро ворид кунед',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({
      id: editingPerson.id,
      data: { name: editPersonName, departmentId: editPersonDepartmentId },
    });
  };

  const handleDelete = (person: Person) => {
    if (confirm(`Шумо мутмаин ҳастед, ки мехоҳед "${person.name}"-ро бекор кунед?`)) {
      deleteMutation.mutate(person.id);
    }
  };

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Бе шуъба';
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : 'Номаълум';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-green-50">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative flex-1">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={logoImage}
                alt="Logo"
                className="h-12 w-12 rounded-full shadow-md border-2 border-white"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Идораи иҷрокунандагон
                </h1>
                <p className="text-sm text-green-100">
                  EcoDoc - Портали электронӣ
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                data-testid="button-back-admin"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Бозгашт
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Баромадан
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Ҷустуҷӯи иҷрокунанда..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" data-testid="button-add">
                    <Plus className="h-4 w-4 mr-2" />
                    Илова кардан
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Иҷрокунандаи нав</DialogTitle>
                    <DialogDescription>
                      Иҷрокунандаи навро илова кунед
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Ном</Label>
                      <Input
                        id="name"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        placeholder="Номи пурраи иҷрокунанда"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Шуъба (ихтиёрӣ)</Label>
                      <Select
                        value={newPersonDepartmentId?.toString() || 'none'}
                        onValueChange={(val) => setNewPersonDepartmentId(val === 'none' ? null : parseInt(val))}
                      >
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Интихоби шуъба" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Бе шуъба</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Бекор кардан
                    </Button>
                    <Button
                      onClick={handleAdd}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createMutation.isPending}
                      data-testid="button-submit"
                    >
                      Илова кардан
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingPeople || isLoadingDepts ? (
              <div className="text-center py-8 text-gray-500">
                Бор карда истодааст...
              </div>
            ) : people.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Иҷрокунандае ёфт нашуд' : 'Иҷрокунандае мавҷуд нест'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ном</TableHead>
                    <TableHead>Шуъба</TableHead>
                    <TableHead className="text-right">Амалҳо</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {people.map((person) => (
                    <TableRow key={person.id} data-testid={`row-person-${person.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${person.id}`}>
                        {person.name}
                      </TableCell>
                      <TableCell data-testid={`text-department-${person.id}`}>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          {getDepartmentName(person.departmentId)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(person)}
                            data-testid={`button-edit-${person.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(person)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${person.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Таҳрири иҷрокунанда</DialogTitle>
            <DialogDescription>
              Маълумоти иҷрокунандаро тағйир диҳед
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Ном</Label>
              <Input
                id="edit-name"
                value={editPersonName}
                onChange={(e) => setEditPersonName(e.target.value)}
                placeholder="Номи пурраи иҷрокунанда"
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-department">Шуъба (ихтиёрӣ)</Label>
              <Select
                value={editPersonDepartmentId?.toString() || 'none'}
                onValueChange={(val) => setEditPersonDepartmentId(val === 'none' ? null : parseInt(val))}
              >
                <SelectTrigger data-testid="select-edit-department">
                  <SelectValue placeholder="Интихоби шуъба" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Бе шуъба</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-edit-cancel"
            >
              Бекор кардан
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-green-600 hover:bg-green-700"
              disabled={updateMutation.isPending}
              data-testid="button-edit-submit"
            >
              Сабт кардан
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
