import { useState } from 'react';
import { Plus, Search, Filter, DollarSign, Calendar, User, Building2, CreditCard } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useDonations, useCreateDonation, useDonors, useProjects } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

export default function Donations() {
  const { data: donations, isLoading } = useDonations();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
  const createDonation = useCreateDonation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newDonation, setNewDonation] = useState({
    donorId: '',
    projectId: '',
    amount: '',
    paymentMethod: 'pix',
    paymentStatus: 'completed',
    campaignSource: '',
    isRecurring: false,
    recurringFrequency: '',
    notes: '',
  });

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDonation.mutateAsync({
        ...newDonation,
        amount: parseFloat(newDonation.amount),
        donorId: newDonation.donorId || null,
        projectId: newDonation.projectId || null,
      });
      
      toast({
        title: 'Doação registrada',
        description: 'A doação foi registrada com sucesso.',
      });
      setIsCreateModalOpen(false);
      setNewDonation({
        donorId: '',
        projectId: '',
        amount: '',
        paymentMethod: 'pix',
        paymentStatus: 'completed',
        campaignSource: '',
        isRecurring: false,
        recurringFrequency: '',
        notes: '',
      });
    } catch (error) {
      toast({
        title: 'Erro ao registrar doação',
        description: 'Não foi possível registrar a doação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'status-warning';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'refunded':
        return 'Reembolsada';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return '💳';
      case 'credit_card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'cash':
        return '💰';
      default:
        return '💳';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'bank_transfer':
        return 'Transferência';
      case 'cash':
        return 'Dinheiro';
      default:
        return method;
    }
  };

  const filteredDonations = donations?.filter((donation: any) => {
    const donor = donors?.find((d: any) => d.id === donation.donorId);
    const project = projects?.find((p: any) => p.id === donation.projectId);
    
    return (
      donation.amount.toString().includes(searchTerm) ||
      donation.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const totalDonations = donations?.reduce((sum: number, donation: any) => 
    donation.paymentStatus === 'completed' ? sum + parseFloat(donation.amount) : sum, 0
  ) || 0;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe todas as doações recebidas
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Doação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Doação</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateDonation} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor da doação *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newDonation.amount}
                      onChange={(e) => setNewDonation(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de pagamento *</Label>
                    <Select
                      value={newDonation.paymentMethod}
                      onValueChange={(value) => setNewDonation(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donor">Doador (opcional)</Label>
                    <Select
                      value={newDonation.donorId}
                      onValueChange={(value) => setNewDonation(prev => ({ ...prev, donorId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um doador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Doador anônimo</SelectItem>
                        {donors?.map((donor: any) => (
                          <SelectItem key={donor.id} value={donor.id}>
                            {donor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto (opcional)</Label>
                    <Select
                      value={newDonation.projectId}
                      onValueChange={(value) => setNewDonation(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Doação geral</SelectItem>
                        {projects?.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Status do pagamento</Label>
                    <Select
                      value={newDonation.paymentStatus}
                      onValueChange={(value) => setNewDonation(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaignSource">Origem da campanha</Label>
                    <Input
                      id="campaignSource"
                      value={newDonation.campaignSource}
                      onChange={(e) => setNewDonation(prev => ({ ...prev, campaignSource: e.target.value }))}
                      placeholder="Ex: Site, Redes Sociais, Evento"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRecurring"
                      checked={newDonation.isRecurring}
                      onCheckedChange={(checked) => setNewDonation(prev => ({ ...prev, isRecurring: checked }))}
                    />
                    <Label htmlFor="isRecurring">Doação recorrente</Label>
                  </div>

                  {newDonation.isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurringFrequency">Frequência</Label>
                      <Select
                        value={newDonation.recurringFrequency}
                        onValueChange={(value) => setNewDonation(prev => ({ ...prev, recurringFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="annually">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDonation.isPending}>
                    {createDonation.isPending ? 'Salvando...' : 'Registrar doação'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDonations)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Doações</p>
                  <p className="text-2xl font-bold text-foreground">{donations?.length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média por Doação</p>
                  <p className="text-2xl font-bold text-foreground">
                    {donations?.length ? formatCurrency(totalDonations / donations.length) : formatCurrency(0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar doações..."
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

        {/* Donations List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDonations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhuma doação encontrada' : 'Nenhuma doação registrada'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros.'
                  : 'Comece registrando sua primeira doação para acompanhar a arrecadação.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeira Doação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDonations.map((donation: any) => {
              const donor = donors?.find((d: any) => d.id === donation.donorId);
              const project = projects?.find((p: any) => p.id === donation.projectId);
              
              return (
                <Card key={donation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">{getPaymentMethodIcon(donation.paymentMethod)}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-xl font-bold text-foreground">
                              {formatCurrency(donation.amount)}
                            </p>
                            <Badge className={`status-badge ${getStatusVariant(donation.paymentStatus)}`}>
                              {getStatusLabel(donation.paymentStatus)}
                            </Badge>
                            {donation.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1">
                              {donor ? (
                                donor.type === 'individual' ? (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                )
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {donor ? donor.name : 'Doador anônimo'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(donation.donationDate)}
                              </span>
                            </div>
                          </div>
                          {project && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Destinado para: <span className="font-medium">{project.name}</span>
                            </p>
                          )}
                          {donation.campaignSource && (
                            <p className="text-sm text-muted-foreground">
                              Origem: {donation.campaignSource}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodLabel(donation.paymentMethod)}
                          </p>
                          {donation.transactionId && (
                            <p className="text-xs text-muted-foreground">
                              ID: {donation.transactionId}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
