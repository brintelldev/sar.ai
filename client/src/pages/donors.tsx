import { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building2, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatDate, formatCPF, formatCNPJ } from '@/lib/utils';
import { useDonors, useCreateDonor, useUpdateDonor } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

export default function Donors() {
  const { data: donors, isLoading } = useDonors();
  const createDonor = useCreateDonor();
  const updateDonor = useUpdateDonor();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<any>(null);

  const [newDonor, setNewDonor] = useState({
    type: 'individual' as 'individual' | 'corporate',
    name: '',
    email: '',
    phone: '',
    document: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    communicationConsent: false,
    donationPreferences: {
      frequency: '',
      preferredAmount: '',
      preferredProjects: [],
    },
  });

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDonor.mutateAsync(newDonor);
      toast({
        title: 'Doador cadastrado',
        description: 'O doador foi cadastrado com sucesso.',
      });
      setIsCreateModalOpen(false);
      resetNewDonorForm();
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar doador',
        description: 'Não foi possível cadastrar o doador. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Sending donor data:', editingDonor);
      await updateDonor.mutateAsync({ 
        id: editingDonor.id, 
        data: editingDonor 
      });
      toast({
        title: 'Doador atualizado',
        description: 'As informações do doador foram atualizadas com sucesso.',
      });
      setIsEditModalOpen(false);
      setEditingDonor(null);
    } catch (error) {
      console.error('Error updating donor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao atualizar doador',
        description: `Erro: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const resetNewDonorForm = () => {
    setNewDonor({
      type: 'individual',
      name: '',
      email: '',
      phone: '',
      document: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      communicationConsent: false,
      donationPreferences: {
        frequency: '',
        preferredAmount: '',
        preferredProjects: [],
      },
    });
  };

  const openEditModal = (donor: any) => {
    setEditingDonor({
      ...donor,
      address: donor.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      donationPreferences: donor.donationPreferences || {
        frequency: '',
        preferredAmount: '',
        preferredProjects: [],
      },
    });
    setIsEditModalOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-warning';
      case 'opted_out':
        return 'destructive';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'opted_out':
        return 'Descadastrado';
      default:
        return status;
    }
  };

  const filteredDonors = donors?.filter((donor: any) =>
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.document?.includes(searchTerm)
  ) || [];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doadores</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os doadores da sua organização
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Doador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Doador</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDonor} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de doador</Label>
                  <Select
                    value={newDonor.type}
                    onValueChange={(value: 'individual' | 'corporate') =>
                      setNewDonor(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Pessoa Física</SelectItem>
                      <SelectItem value="corporate">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {newDonor.type === 'individual' ? 'Nome completo' : 'Razão social'} *
                    </Label>
                    <Input
                      id="name"
                      value={newDonor.name}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">
                      {newDonor.type === 'individual' ? 'CPF' : 'CNPJ'}
                    </Label>
                    <Input
                      id="document"
                      value={newDonor.document}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, document: e.target.value }))}
                      placeholder={newDonor.type === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDonor.email}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newDonor.phone}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Endereço</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Rua, número, complemento"
                        value={newDonor.address.street}
                        onChange={(e) => setNewDonor(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Cidade"
                        value={newDonor.address.city}
                        onChange={(e) => setNewDonor(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Estado"
                        value={newDonor.address.state}
                        onChange={(e) => setNewDonor(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="consent"
                    checked={newDonor.communicationConsent}
                    onCheckedChange={(checked) =>
                      setNewDonor(prev => ({ ...prev, communicationConsent: checked }))
                    }
                  />
                  <Label htmlFor="consent" className="text-sm">
                    Aceita receber comunicações da organização (LGPD)
                  </Label>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDonor.isPending}>
                    {createDonor.isPending ? 'Salvando...' : 'Salvar doador'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Donor Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Doador</DialogTitle>
              </DialogHeader>
              {editingDonor && (
                <form onSubmit={handleEditDonor} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Tipo de doador</Label>
                    <Select
                      value={editingDonor.type}
                      onValueChange={(value: 'individual' | 'corporate') =>
                        setEditingDonor((prev: any) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Pessoa Física</SelectItem>
                        <SelectItem value="corporate">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">
                        {editingDonor.type === 'individual' ? 'Nome completo' : 'Razão social'} *
                      </Label>
                      <Input
                        id="edit-name"
                        value={editingDonor.name}
                        onChange={(e) => setEditingDonor((prev: any) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-document">
                        {editingDonor.type === 'individual' ? 'CPF' : 'CNPJ'}
                      </Label>
                      <Input
                        id="edit-document"
                        value={editingDonor.document || ''}
                        onChange={(e) => setEditingDonor((prev: any) => ({ ...prev, document: e.target.value }))}
                        placeholder={editingDonor.type === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingDonor.email || ''}
                        onChange={(e) => setEditingDonor((prev: any) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Telefone</Label>
                      <Input
                        id="edit-phone"
                        value={editingDonor.phone || ''}
                        onChange={(e) => setEditingDonor((prev: any) => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Endereço</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Rua, número, complemento"
                          value={editingDonor.address?.street || ''}
                          onChange={(e) => setEditingDonor((prev: any) => ({
                            ...prev,
                            address: { ...prev.address, street: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Cidade"
                          value={editingDonor.address?.city || ''}
                          onChange={(e) => setEditingDonor((prev: any) => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Estado"
                          value={editingDonor.address?.state || ''}
                          onChange={(e) => setEditingDonor((prev: any) => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingDonor.status || 'active'}
                      onValueChange={(value) =>
                        setEditingDonor((prev: any) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="opted_out">Descadastrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-consent"
                      checked={editingDonor.communicationConsent || false}
                      onCheckedChange={(checked) =>
                        setEditingDonor((prev: any) => ({ ...prev, communicationConsent: checked }))
                      }
                    />
                    <Label htmlFor="edit-consent" className="text-sm">
                      Aceita receber comunicações da organização (LGPD)
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingDonor(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateDonor.isPending}>
                      {updateDonor.isPending ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar doadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Donors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDonors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhum doador encontrado' : 'Nenhum doador cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros.'
                  : 'Comece cadastrando seu primeiro doador para gerenciar as doações.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Doador
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonors.map((donor: any) => (
              <Card key={donor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        {donor.type === 'individual' ? (
                          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{donor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {donor.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </p>
                      </div>
                    </div>
                    <Badge className={`status-badge ${getStatusVariant(donor.status)}`}>
                      {getStatusLabel(donor.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {donor.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {donor.email}
                        </span>
                      </div>
                    )}
                    
                    {donor.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {donor.phone}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total doado:</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(donor.totalDonated || 0)}
                        </span>
                      </div>
                      {donor.lastDonationDate && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Última doação:</span>
                          <span className="text-muted-foreground">
                            {formatDate(donor.lastDonationDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm">
                      Ver Histórico
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(donor)}
                    >
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
