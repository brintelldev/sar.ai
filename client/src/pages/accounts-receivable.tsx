import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Plus, DollarSign, Clock, CheckCircle, AlertTriangle, Search, Filter, Eye, Edit, CalendarDays, X } from 'lucide-react';

const insertAccountReceivableSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.string().default('pending'),
  invoiceNumber: z.string().optional(),
});

export default function AccountsReceivable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Advanced filters
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [invoiceFilter, setInvoiceFilter] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/accounts-receivable'],
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/accounts-receivable', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts-receivable'] });
      toast({
        title: "Conta a receber registrada",
        description: "A nova conta foi adicionada ao sistema.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao registrar conta",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/accounts-receivable/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts-receivable'] });
      toast({
        title: "Conta atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditDialogOpen(false);
      editForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar conta",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertAccountReceivableSchema),
    defaultValues: {
      description: '',
      amount: '',
      dueDate: '',
      status: 'pending',
      invoiceNumber: '',
    }
  });

  const editForm = useForm({
    resolver: zodResolver(insertAccountReceivableSchema),
    defaultValues: {
      description: '',
      amount: '',
      dueDate: '',
      status: 'pending',
      invoiceNumber: '',
    }
  });

  const onSubmit = async (data: any) => {
    await createAccountMutation.mutateAsync(data);
  };

  const onEditSubmit = async (data: any) => {
    if (!selectedAccount) return;
    await updateAccountMutation.mutateAsync({
      id: selectedAccount.id,
      data: data
    });
  };

  const handleViewAccount = (account: any) => {
    setSelectedAccount(account);
    setIsViewDialogOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    editForm.reset({
      description: account.description || '',
      amount: account.amount || '',
      dueDate: account.dueDate || '',
      status: account.status || 'pending',
      invoiceNumber: account.invoiceNumber || '',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'received':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'received': 'Recebido',
      'pending': 'Pendente',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAmountFilter({ min: '', max: '' });
    setDateFilter({ start: '', end: '' });
    setInvoiceFilter('');
    setIsFilterOpen(false);
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || statusFilter !== 'all' || 
           amountFilter.min !== '' || amountFilter.max !== '' ||
           dateFilter.start !== '' || dateFilter.end !== '' || 
           invoiceFilter !== '';
  };

  const filteredAccounts = Array.isArray(accounts) ? accounts.filter((account: any) => {
    const matchesSearch = account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    
    // Amount filter
    const accountAmount = parseFloat(account.amount || 0);
    const matchesMinAmount = !amountFilter.min || accountAmount >= parseFloat(amountFilter.min);
    const matchesMaxAmount = !amountFilter.max || accountAmount <= parseFloat(amountFilter.max);
    
    // Date filter
    const accountDate = new Date(account.dueDate);
    const matchesStartDate = !dateFilter.start || accountDate >= new Date(dateFilter.start);
    const matchesEndDate = !dateFilter.end || accountDate <= new Date(dateFilter.end);
    
    // Invoice filter
    const matchesInvoice = !invoiceFilter || 
      account.invoiceNumber?.toLowerCase().includes(invoiceFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesMinAmount && matchesMaxAmount && 
           matchesStartDate && matchesEndDate && matchesInvoice;
  }) : [];

  // Filtered accounts by status
  const pendingAccounts = filteredAccounts.filter((a: any) => a.status === 'pending');
  const overdueAccounts = filteredAccounts.filter((a: any) => a.status === 'overdue');
  const receivedAccounts = filteredAccounts.filter((a: any) => a.status === 'received');
  
  // Calculate amounts for each status
  const pendingAmount = pendingAccounts.reduce((sum: number, account: any) => 
    sum + parseFloat(account.amount || 0), 0
  );
  
  const overdueAmount = overdueAccounts.reduce((sum: number, account: any) => 
    sum + parseFloat(account.amount || 0), 0
  );
  
  const receivedAmount = receivedAccounts.reduce((sum: number, account: any) => 
    sum + parseFloat(account.amount || 0), 0
  );
  
  // Total a receber = Pendentes + Vencidas
  const totalToReceive = pendingAmount + overdueAmount;
  const totalToReceiveCount = pendingAccounts.length + overdueAccounts.length;

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
            <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie valores a receber de doadores e parcerias
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Receber
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Conta a Receber</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta a receber no sistema.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrição da conta a receber" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="received">Recebido</SelectItem>
                              <SelectItem value="overdue">Vencido</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Fatura</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número da fatura (opcional)" />
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
                    <Button type="submit" disabled={createAccountMutation.isPending}>
                      {createAccountMutation.isPending ? 'Salvando...' : 'Registrar Conta'}
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
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalToReceive)}</div>
              <p className="text-xs text-muted-foreground">
                {totalToReceiveCount} contas (pendentes + vencidas)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(pendingAmount)} aguardando
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(overdueAmount)} em atraso
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receivedAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(receivedAmount)} recebido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por descrição ou número da fatura..."
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
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="received">Recebidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={hasActiveFilters() ? "default" : "outline"} 
                  size="icon"
                  className={hasActiveFilters() ? "bg-primary text-primary-foreground" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros Avançados</h4>
                    {hasActiveFilters() && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Amount Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor (R$)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="Mínimo"
                          type="number"
                          step="0.01"
                          value={amountFilter.min}
                          onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Máximo"
                          type="number"
                          step="0.01"
                          value={amountFilter.max}
                          onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Data de Vencimento
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="De"
                          type="date"
                          value={dateFilter.start}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Até"
                          type="date"
                          value={dateFilter.end}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Número da Fatura</Label>
                    <Input
                      placeholder="Buscar por número da fatura..."
                      value={invoiceFilter}
                      onChange={(e) => setInvoiceFilter(e.target.value)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{filteredAccounts.length} contas encontradas</span>
                    <Button 
                      size="sm" 
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Busca: {searchTerm}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSearchTerm('')}
                />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {getStatusLabel(statusFilter)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStatusFilter('all')}
                />
              </Badge>
            )}
            {(amountFilter.min || amountFilter.max) && (
              <Badge variant="secondary" className="gap-1">
                Valor: {amountFilter.min && `≥ ${formatCurrency(parseFloat(amountFilter.min))}`}
                {amountFilter.min && amountFilter.max && ' e '}
                {amountFilter.max && `≤ ${formatCurrency(parseFloat(amountFilter.max))}`}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setAmountFilter({ min: '', max: '' })}
                />
              </Badge>
            )}
            {(dateFilter.start || dateFilter.end) && (
              <Badge variant="secondary" className="gap-1">
                Data: {dateFilter.start && formatDate(dateFilter.start)}
                {dateFilter.start && dateFilter.end && ' até '}
                {dateFilter.end && formatDate(dateFilter.end)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setDateFilter({ start: '', end: '' })}
                />
              </Badge>
            )}
            {invoiceFilter && (
              <Badge variant="secondary" className="gap-1">
                Fatura: {invoiceFilter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setInvoiceFilter('')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contas a Receber</CardTitle>
            <CardDescription>
              Histórico completo de valores a receber
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece registrando a primeira conta a receber'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fatura</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account: any) => (
                      <tr key={account.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{account.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatCurrency(parseFloat(account.amount))}</div>
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(account.dueDate)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(account.status)}>
                            {getStatusLabel(account.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-32 truncate">
                            {account.invoiceNumber || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewAccount(account)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditAccount(account)}
                            >
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

        {/* View Account Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Conta a Receber</DialogTitle>
              <DialogDescription>
                Informações completas sobre a conta selecionada.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAccount && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="text-sm">{selectedAccount.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor</label>
                    <p className="text-sm font-semibold">{formatCurrency(parseFloat(selectedAccount.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Vencimento</label>
                    <p className="text-sm">{formatDate(selectedAccount.dueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={getStatusVariant(selectedAccount.status)}>
                      {getStatusLabel(selectedAccount.status)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número da Fatura</label>
                    <p className="text-sm">{selectedAccount.invoiceNumber || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                    <p className="text-sm">{formatDate(selectedAccount.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditAccount(selectedAccount);
                }}
              >
                Editar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Conta a Receber</DialogTitle>
              <DialogDescription>
                Altere as informações da conta selecionada.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Descrição da conta a receber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="received">Recebido</SelectItem>
                            <SelectItem value="overdue">Vencido</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Fatura</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número da fatura (opcional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateAccountMutation.isPending}>
                    {updateAccountMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}