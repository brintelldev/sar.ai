import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDonations, useCreateDonation, useDonors, useProjects } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, TrendingUp, Calendar, Heart, Search, Filter, Eye, Edit } from 'lucide-react';

export default function Donations() {
  const { data: donations, isLoading } = useDonations();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const createDonationMutation = useCreateDonation();

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'pix',
    paymentStatus: 'completed',
    campaignSource: '',
    donationDate: new Date().toISOString().split('T')[0],
    notes: '',
    donorId: '',
    projectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount) {
      toast({
        title: "Erro de validação",
        description: "O valor da doação é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const submissionData = {
        ...formData,
        amount: formData.amount,
        donorId: formData.donorId || null,
        projectId: formData.projectId || null,
        donationDate: new Date(formData.donationDate),
      };

      await createDonationMutation.mutateAsync(submissionData);
      
      toast({
        title: "Doação registrada com sucesso",
        description: "A nova doação foi adicionada ao sistema.",
      });
      
      setIsDialogOpen(false);
      setFormData({
        amount: '',
        paymentMethod: 'pix',
        paymentStatus: 'completed',
        campaignSource: '',
        donationDate: new Date().toISOString().split('T')[0],
        notes: '',
        donorId: '',
        projectId: '',
      });
    } catch (error: any) {
      toast({
        title: "Erro ao registrar doação",
        description: "Ocorreu um erro ao salvar a doação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleViewDonation = (donation: any) => {
    setSelectedDonation(donation);
    setIsViewDialogOpen(true);
  };

  const handleEditDonation = (donation: any) => {
    setSelectedDonation(donation);
    setFormData({
      amount: donation.amount,
      paymentMethod: donation.paymentMethod || 'pix',
      paymentStatus: donation.paymentStatus || 'completed',
      campaignSource: donation.campaignSource || '',
      donationDate: new Date(donation.donationDate).toISOString().split('T')[0],
      notes: donation.notes || '',
      donorId: donation.donorId || 'anonymous',
      projectId: donation.projectId || 'general',
    });
    setIsEditDialogOpen(true);
  };

  const getDonorName = (donorId: string) => {
    const donor = donors?.find((d: any) => d.id === donorId);
    return donor ? donor.name : 'Doador anônimo';
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p: any) => p.id === projectId);
    return project ? project.name : 'Doação geral';
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'bank_transfer': 'Transferência Bancária',
      'cash': 'Dinheiro',
      'check': 'Cheque'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'completed': 'default',
      'failed': 'destructive',
      'refunded': 'outline'
    } as const;
    
    const labels = {
      'pending': 'Pendente',
      'completed': 'Concluída',
      'failed': 'Falhou',
      'refunded': 'Reembolsada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando doações...</div>
        </div>
      </MainLayout>
    );
  }

  const filteredDonations = donations?.filter((donation: any) => {
    const matchesSearch = donation.amount?.toString().includes(searchTerm) ||
                         donation.campaignSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || donation.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const totalDonated = donations?.reduce((sum: number, donation: any) => 
    sum + parseFloat(donation.amount || '0'), 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doações</h1>
            <p className="text-muted-foreground">
              Gerencie e monitore todas as doações recebidas pela organização.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Doação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Doação</DialogTitle>
                <DialogDescription>
                  Adicione uma nova doação recebida pela organização.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                        <SelectItem value="refunded">Reembolsada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="donationDate">Data da Doação</Label>
                    <Input
                      id="donationDate"
                      type="date"
                      value={formData.donationDate}
                      onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignSource">Fonte da Campanha</Label>
                  <Input
                    id="campaignSource"
                    placeholder="Ex: Site, Evento, Rede Social"
                    value={formData.campaignSource}
                    onChange={(e) => setFormData({ ...formData, campaignSource: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donorId">Doador (Opcional)</Label>
                  <Select 
                    value={formData.donorId} 
                    onValueChange={(value) => setFormData({ ...formData, donorId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um doador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum doador específico</SelectItem>
                      {donors?.map((donor: any) => (
                        <SelectItem key={donor.id} value={donor.id}>
                          {donor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Projeto (Opcional)</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Doação geral</SelectItem>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre a doação"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDonationMutation.isPending}>
                    {createDonationMutation.isPending ? 'Registrando...' : 'Registrar Doação'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDonated)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total de todas as doações
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Doações</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donations?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Número total de doações registradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donations?.filter((d: any) => {
                  const donationDate = new Date(d.donationDate);
                  const now = new Date();
                  return donationDate.getMonth() === now.getMonth() && 
                         donationDate.getFullYear() === now.getFullYear();
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Doações recebidas neste mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por valor, fonte ou método de pagamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="refunded">Reembolsada</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donations List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Doações</CardTitle>
            <CardDescription>
              Todas as doações registradas na organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDonations.length === 0 ? (
              <div className="text-center py-6">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Nenhuma doação encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {donations?.length === 0 
                    ? "Comece registrando a primeira doação da organização."
                    : "Tente ajustar os filtros para encontrar as doações desejadas."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDonations.map((donation: any) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold">
                          {formatCurrency(parseFloat(donation.amount))}
                        </div>
                        {getStatusBadge(donation.paymentStatus)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getPaymentMethodLabel(donation.paymentMethod)} • {formatDate(donation.donationDate)}
                        {donation.campaignSource && ` • ${donation.campaignSource}`}
                      </div>
                      {donation.notes && (
                        <div className="text-xs text-muted-foreground">
                          {donation.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDonation(donation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditDonation(donation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Donation Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Doação</DialogTitle>
              <DialogDescription>
                Informações completas da doação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedDonation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                    <p className="text-lg font-semibold">{formatCurrency(parseFloat(selectedDonation.amount))}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedDonation.paymentStatus)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                    <p>{formatDate(selectedDonation.donationDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Método de Pagamento</Label>
                    <p>{getPaymentMethodLabel(selectedDonation.paymentMethod)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Doador</Label>
                  <p>{selectedDonation.donorId ? getDonorName(selectedDonation.donorId) : 'Doador anônimo'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Projeto</Label>
                  <p>{selectedDonation.projectId ? getProjectName(selectedDonation.projectId) : 'Doação geral'}</p>
                </div>

                {selectedDonation.campaignSource && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fonte da Campanha</Label>
                    <p>{selectedDonation.campaignSource}</p>
                  </div>
                )}

                {selectedDonation.transactionId && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID da Transação</Label>
                    <p className="text-xs font-mono">{selectedDonation.transactionId}</p>
                  </div>
                )}

                {selectedDonation.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                    <p className="text-sm">{selectedDonation.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Donation Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Doação</DialogTitle>
              <DialogDescription>
                Modifique as informações da doação
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Implement update functionality
              toast({
                title: "Funcionalidade em desenvolvimento",
                description: "A edição de doações será implementada em breve.",
              });
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Valor (R$)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Data da Doação</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={formData.donationDate}
                      onChange={(e) => setFormData({...formData, donationDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-payment-method">Método de Pagamento</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({...formData, paymentStatus: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                        <SelectItem value="refunded">Reembolsada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-donor">Doador</Label>
                  <Select value={formData.donorId} onValueChange={(value) => setFormData({...formData, donorId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um doador (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anonymous">Doador anônimo</SelectItem>
                      {donors?.map((donor: any) => (
                        <SelectItem key={donor.id} value={donor.id}>
                          {donor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-project">Projeto</Label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Doação geral</SelectItem>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-campaign">Fonte da Campanha</Label>
                  <Input
                    id="edit-campaign"
                    value={formData.campaignSource}
                    onChange={(e) => setFormData({...formData, campaignSource: e.target.value})}
                    placeholder="Website, Instagram, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Input
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Informações adicionais sobre a doação"
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}