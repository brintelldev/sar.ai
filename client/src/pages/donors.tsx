import { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building2, User, Clock, Heart, Eye } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatDate, formatCPF, formatCNPJ, maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/utils';
import { useDonors, useCreateDonor, useUpdateDonor, useDonations } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

export default function Donors() {
  const { data: donors, isLoading } = useDonors();
  const { data: donations } = useDonations();
  const createDonor = useCreateDonor();
  const updateDonor = useUpdateDonor();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDonorForHistory, setSelectedDonorForHistory] = useState<any>(null);
  const [isDonationViewModalOpen, setIsDonationViewModalOpen] = useState(false);
  const [selectedDonationForView, setSelectedDonationForView] = useState<any>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, individual, corporate
    status: 'all', // all, active, inactive, opted_out
    communicationConsent: 'all', // all, yes, no
    hasHistory: 'all', // all, yes, no
  });
  const [historySearchTerm, setHistorySearchTerm] = useState('');

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

  const openHistoryModal = (donor: any) => {
    setSelectedDonorForHistory(donor);
    setIsHistoryModalOpen(true);
  };

  // Filtrar doações do doador selecionado
  const donorDonations = selectedDonorForHistory && donations ? 
    donations.filter((donation: any) => donation.donorId === selectedDonorForHistory.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  // Filtrar doações no histórico por busca
  const filteredDonorDonations = donorDonations.filter((donation: any) => {
    if (!historySearchTerm) return true;
    
    const searchLower = historySearchTerm.toLowerCase();
    return (
      donation.projectName?.toLowerCase().includes(searchLower) ||
      donation.paymentMethod?.toLowerCase().includes(searchLower) ||
      donation.notes?.toLowerCase().includes(searchLower) ||
      donation.amount?.toString().includes(searchLower)
    );
  });

  // Calcular estatísticas do histórico (baseado em todas as doações, não nas filtradas)
  const historyStats = {
    totalDonations: donorDonations.length,
    totalAmount: donorDonations.reduce((sum: number, donation: any) => sum + parseFloat(donation.amount || 0), 0),
    avgAmount: donorDonations.length > 0 ? 
      donorDonations.reduce((sum: number, donation: any) => sum + parseFloat(donation.amount || 0), 0) / donorDonations.length : 0,
  };

  // Função para abrir modal de visualização de doação
  const openDonationViewModal = (donation: any) => {
    setSelectedDonationForView(donation);
    setIsDonationViewModalOpen(true);
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

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      communicationConsent: 'all',
      hasHistory: 'all',
    });
    setSearchTerm('');
  };

  // Verificar se doador tem histórico de doações
  const donorHasHistory = (donorId: string) => {
    return donations?.some((donation: any) => donation.donorId === donorId) || false;
  };

  // Calcular total doado por doador
  const getTotalDonatedByDonor = (donorId: string) => {
    if (!donations) return 0;
    return donations
      .filter((donation: any) => donation.donorId === donorId)
      .reduce((total: number, donation: any) => total + (parseFloat(donation.amount) || 0), 0);
  };

  // Obter última data de doação do doador
  const getLastDonationDate = (donorId: string) => {
    if (!donations) return null;
    const donorDonations = donations
      .filter((donation: any) => donation.donorId === donorId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return donorDonations.length > 0 ? donorDonations[0].createdAt : null;
  };

  // Filtros aplicados
  const filteredDonors = donors?.filter((donor: any) => {
    // Filtro de busca
    const matchesSearch = !searchTerm || 
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.document?.includes(searchTerm);

    // Filtro de tipo
    const matchesType = filters.type === 'all' || donor.type === filters.type;

    // Filtro de status
    const matchesStatus = filters.status === 'all' || donor.status === filters.status;

    // Filtro de consentimento
    const matchesConsent = filters.communicationConsent === 'all' || 
      (filters.communicationConsent === 'yes' && donor.communicationConsent) ||
      (filters.communicationConsent === 'no' && !donor.communicationConsent);

    // Filtro de histórico
    const matchesHistory = filters.hasHistory === 'all' ||
      (filters.hasHistory === 'yes' && donorHasHistory(donor.id)) ||
      (filters.hasHistory === 'no' && !donorHasHistory(donor.id));

    return matchesSearch && matchesType && matchesStatus && matchesConsent && matchesHistory;
  }) || [];

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

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
                      onChange={(e) => {
                        const maskedValue = newDonor.type === 'individual' 
                          ? maskCPF(e.target.value)
                          : maskCNPJ(e.target.value);
                        setNewDonor(prev => ({ ...prev, document: maskedValue }));
                      }}
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
                      onChange={(e) => {
                        const maskedPhone = maskPhone(e.target.value);
                        setNewDonor(prev => ({ ...prev, phone: maskedPhone }));
                      }}
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
                    <div>
                      <Input
                        placeholder="CEP"
                        value={newDonor.address.zipCode}
                        onChange={(e) => {
                          const maskedCEP = maskCEP(e.target.value);
                          setNewDonor(prev => ({
                            ...prev,
                            address: { ...prev.address, zipCode: maskedCEP }
                          }));
                        }}
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
                        onChange={(e) => {
                          const maskedValue = editingDonor.type === 'individual' 
                            ? maskCPF(e.target.value)
                            : maskCNPJ(e.target.value);
                          setEditingDonor((prev: any) => ({ ...prev, document: maskedValue }));
                        }}
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
                        onChange={(e) => {
                          const maskedPhone = maskPhone(e.target.value);
                          setEditingDonor((prev: any) => ({ ...prev, phone: maskedPhone }));
                        }}
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
                      <div>
                        <Input
                          placeholder="CEP"
                          value={editingDonor.address?.zipCode || ''}
                          onChange={(e) => {
                            const maskedCEP = maskCEP(e.target.value);
                            setEditingDonor((prev: any) => ({
                              ...prev,
                              address: { ...prev.address, zipCode: maskedCEP }
                            }));
                          }}
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
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Filtrar Doadores</DialogTitle>
                <DialogDescription>
                  Aplique filtros para refinar a visualização dos doadores.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Filtro por tipo */}
                <div className="space-y-2">
                  <Label>Tipo de doador</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="individual">Pessoa Física</SelectItem>
                      <SelectItem value="corporate">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="opted_out">Descadastrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por consentimento */}
                <div className="space-y-2">
                  <Label>Consentimento de comunicação</Label>
                  <Select
                    value={filters.communicationConsent}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, communicationConsent: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="yes">Com consentimento</SelectItem>
                      <SelectItem value="no">Sem consentimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por histórico */}
                <div className="space-y-2">
                  <Label>Histórico de doações</Label>
                  <Select
                    value={filters.hasHistory}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, hasHistory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="yes">Com doações</SelectItem>
                      <SelectItem value="no">Sem doações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    disabled={activeFiltersCount === 0}
                  >
                    Limpar Filtros
                  </Button>
                  <Button onClick={() => setIsFilterModalOpen(false)}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {filters.type !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {filters.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {getStatusLabel(filters.status)}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.communicationConsent !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Consentimento: {filters.communicationConsent === 'yes' ? 'Com' : 'Sem'}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, communicationConsent: 'all' }))}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.hasHistory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Histórico: {filters.hasHistory === 'yes' ? 'Com doações' : 'Sem doações'}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, hasHistory: 'all' }))}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                Limpar todos
              </Button>
            </div>
          </div>
        )}

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
                          {formatCurrency(getTotalDonatedByDonor(donor.id))}
                        </span>
                      </div>
                      {getLastDonationDate(donor.id) && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Última doação:</span>
                          <span className="text-muted-foreground">
                            {formatDate(getLastDonationDate(donor.id))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openHistoryModal(donor)}
                    >
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

      {/* Modal de Histórico de Doações */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Doações - {selectedDonorForHistory?.name}
            </DialogTitle>
            <DialogDescription>
              Visualize todas as doações realizadas por este doador.
            </DialogDescription>
          </DialogHeader>

          {selectedDonorForHistory && (
            <div className="space-y-6">
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {historyStats.totalDonations}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total de Doações
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(historyStats.totalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Valor Total
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(historyStats.avgAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Valor Médio
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campo de Busca e Tabela de Doações */}
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Histórico Detalhado</h3>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar doações por projeto, método ou observações..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {filteredDonorDonations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Heart className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {historySearchTerm 
                        ? 'Nenhuma doação encontrada com os termos de busca.'
                        : 'Este doador ainda não realizou nenhuma doação.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/20">
                        <tr>
                          <th className="text-left p-3 font-medium">Data</th>
                          <th className="text-left p-3 font-medium">Valor</th>
                          <th className="text-left p-3 font-medium">Projeto</th>
                          <th className="text-left p-3 font-medium">Método</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDonorDonations.map((donation: any) => (
                          <tr key={donation.id} className="border-b hover:bg-muted/10">
                            <td className="p-3">
                              {formatDate(donation.date)}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(parseFloat(donation.amount))}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">
                                {donation.projectName || 'Doação Geral'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-sm capitalize">
                                {donation.paymentMethod || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                donation.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : donation.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {donation.status === 'confirmed' && 'Confirmada'}
                                {donation.status === 'pending' && 'Pendente'}
                                {donation.status === 'cancelled' && 'Cancelada'}
                                {!donation.status && 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDonationViewModal(donation)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Detalhada da Doação */}
      <Dialog open={isDonationViewModalOpen} onOpenChange={setIsDonationViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Doação</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta doação
            </DialogDescription>
          </DialogHeader>

          {selectedDonationForView && (
            <div className="space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Valor</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(parseFloat(selectedDonationForView.amount))}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Data</h3>
                    <p className="text-lg">
                      {formatDate(selectedDonationForView.date)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Projeto</h3>
                    <p className="text-lg">
                      {selectedDonationForView.projectName || 'Doação Geral'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Método de Pagamento</h3>
                    <p className="text-lg capitalize">
                      {selectedDonationForView.paymentMethod || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Status */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Status</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedDonationForView.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : selectedDonationForView.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {selectedDonationForView.status === 'confirmed' && 'Confirmada'}
                    {selectedDonationForView.status === 'pending' && 'Pendente'}
                    {selectedDonationForView.status === 'cancelled' && 'Cancelada'}
                    {!selectedDonationForView.status && 'N/A'}
                  </span>
                </CardContent>
              </Card>

              {/* Observações */}
              {selectedDonationForView.notes && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Observações</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedDonationForView.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Informações de Sistema */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Informações do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID da Doação:</span>
                      <p className="font-mono text-xs break-all">{selectedDonationForView.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <p>{formatDate(selectedDonationForView.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
