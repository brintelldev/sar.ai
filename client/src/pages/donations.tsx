import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDonations, useCreateDonation, useDonors, useProjects } from '@/hooks/use-organization';
import { insertDonationSchema } from '@/../../shared/schema';
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
  const { toast } = useToast();
  const createDonationMutation = useCreateDonation();

  const form = useForm({
    resolver: zodResolver(insertDonationSchema),
    defaultValues: {
      amount: '',
      currency: 'BRL',
      paymentMethod: 'pix',
      paymentStatus: 'pending',
      campaignSource: '',
      isRecurring: false,
      recurringFrequency: '',
      donationDate: new Date().toISOString().split('T')[0],
      notes: '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await createDonationMutation.mutateAsync(data);
      toast({
        title: "Doação registrada com sucesso",
        description: "A nova doação foi adicionada ao sistema.",
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast({
        title: "Erro ao registrar doação",
        description: "Ocorreu um erro ao salvar a doação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'bank_transfer': 'Transferência Bancária',
      'cash': 'Dinheiro',
      'check': 'Cheque'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'completed': 'Concluída',
      'pending': 'Pendente',
      'failed': 'Falhou',
      'refunded': 'Reembolsada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredDonations = Array.isArray(donations) ? donations.filter((donation: any) => {
    const matchesSearch = donation.campaignSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const totalDonated = filteredDonations.reduce((sum: number, donation: any) => 
    sum + parseFloat(donation.amount || 0), 0
  );

  const completedDonations = filteredDonations.filter((d: any) => d.paymentStatus === 'completed');
  const recurringDonations = filteredDonations.filter((d: any) => d.isRecurring);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as doações recebidas pela organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Doação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nova Doação</DialogTitle>
                <DialogDescription>
                  Adicione uma nova doação recebida pela organização.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o método" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                              <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                              <SelectItem value="cash">Dinheiro</SelectItem>
                              <SelectItem value="check">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status do Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="failed">Falhou</SelectItem>
                              <SelectItem value="refunded">Reembolsada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="donationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Doação</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campaignSource"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Fonte da Campanha</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Website, Instagram, evento..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Informações adicionais sobre a doação" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createDonationMutation.isPending}>
                      {createDonationMutation.isPending ? 'Salvando...' : 'Registrar Doação'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDonated)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredDonations.length} doações registradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doações Concluídas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedDonations.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(completedDonations.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0))} confirmado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doações Recorrentes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recurringDonations.length}</div>
              <p className="text-xs text-muted-foreground">
                Doadores mensais ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredDonations.length > 0 ? formatCurrency(totalDonated / filteredDonations.length) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio por doação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por fonte da campanha ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="failed">Falharam</SelectItem>
                <SelectItem value="refunded">Reembolsadas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Doações</CardTitle>
            <CardDescription>
              Histórico completo de doações recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDonations.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma doação encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece registrando a primeira doação'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Método</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fonte</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation: any) => (
                      <tr key={donation.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          {formatDate(donation.donationDate || donation.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatCurrency(parseFloat(donation.amount))}</div>
                          {donation.isRecurring && (
                            <span className="text-xs text-muted-foreground">Recorrente</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getPaymentMethodLabel(donation.paymentMethod)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(donation.paymentStatus)}>
                            {getStatusLabel(donation.paymentStatus)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-32 truncate">
                            {donation.campaignSource || 'Não informado'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}