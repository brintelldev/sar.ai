import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useProjects } from '@/hooks/use-organization';
import { z } from 'zod';
import { Plus, DollarSign, Clock, CheckCircle, AlertTriangle, Search, Filter, Eye, Edit, CreditCard, Check, ChevronDown } from 'lucide-react';

const insertAccountPayableSchema = z.object({
  supplierName: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.string().default('pending'),
  category: z.string().optional(),
  projectId: z.string().optional(),
});

export default function AccountsPayable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectComboboxOpen, setProjectComboboxOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProjectComboboxOpen, setEditProjectComboboxOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/accounts-payable'],
  });

  const { data: projects = [] } = useProjects();

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/accounts-payable', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts-payable'] });
      toast({
        title: "Conta a pagar registrada",
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
    mutationFn: (data: any) => apiRequest(`/api/accounts-payable/${selectedAccount?.id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts-payable'] });
      setIsEditDialogOpen(false);
      setSelectedAccount(null);
      toast({
        title: "Conta atualizada",
        description: "As informações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertAccountPayableSchema),
    defaultValues: {
      supplierName: '',
      description: '',
      amount: '',
      dueDate: '',
      status: 'pending',
      category: '',
      projectId: '',
    }
  });

  const watchCategory = form.watch('category');
  const watchProjectId = form.watch('projectId');

  // Formulário para edição
  const editForm = useForm({
    resolver: zodResolver(insertAccountPayableSchema),
    defaultValues: {
      supplierName: '',
      description: '',
      amount: '',
      dueDate: '',
      status: 'pending',
      category: '',
      projectId: '',
    }
  });

  const watchEditCategory = editForm.watch('category');

  const onSubmit = async (data: any) => {
    await createAccountMutation.mutateAsync(data);
  };

  const onEditSubmit = async (data: any) => {
    await updateAccountMutation.mutateAsync(data);
  };

  const handleViewAccount = (account: any) => {
    setSelectedAccount(account);
    setIsViewDialogOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    editForm.reset({
      supplierName: account.supplierName,
      description: account.description,
      amount: account.amount.toString(),
      dueDate: account.dueDate,
      status: account.status,
      category: account.category || '',
      projectId: account.projectId || '',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'pending':
        return 'outline';
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
      'paid': 'Pago',
      'approved': 'Aprovado',
      'pending': 'Pendente',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'administrative': 'Administrativo',
      'project': 'Projeto',
      'operational': 'Operacional'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || 'Projeto não encontrado';
  };

  const filteredAccounts = Array.isArray(accounts) ? accounts.filter((account: any) => {
    const matchesSearch = account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const totalAmount = filteredAccounts.reduce((sum: number, account: any) => 
    sum + parseFloat(account.amount || 0), 0
  );

  const pendingAccounts = filteredAccounts.filter((a: any) => a.status === 'pending');
  const overdueAccounts = filteredAccounts.filter((a: any) => a.status === 'overdue');
  const paidAccounts = filteredAccounts.filter((a: any) => a.status === 'paid');

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
            <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as despesas e contas a pagar da organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Pagar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Conta a Pagar</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta a pagar no sistema.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Fornecedor</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do fornecedor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="administrative">Administrativo</SelectItem>
                              <SelectItem value="project">Projeto</SelectItem>
                              <SelectItem value="operational">Operacional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campo condicional de projeto */}
                    {watchCategory === 'project' && (
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projeto</FormLabel>
                            <Popover open={projectComboboxOpen} onOpenChange={setProjectComboboxOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={projectComboboxOpen}
                                    className="w-full justify-between"
                                  >
                                    {field.value
                                      ? projects.find((project: any) => project.id === field.value)?.name
                                      : "Selecione um projeto..."}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar projeto..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {projects.map((project: any) => (
                                        <CommandItem
                                          key={project.id}
                                          value={project.name}
                                          onSelect={() => {
                                            form.setValue('projectId', project.id);
                                            setProjectComboboxOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              field.value === project.id ? "opacity-100" : "opacity-0"
                                            }`}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{project.name}</span>
                                            <span className="text-sm text-muted-foreground truncate">
                                              {project.description}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrição da despesa" />
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
                        <FormItem className="col-span-2">
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="approved">Aprovado</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Vencido</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
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

          {/* Dialog de Visualização */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
                <DialogDescription>
                  Informações completas da conta selecionada
                </DialogDescription>
              </DialogHeader>
              
              {selectedAccount && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Fornecedor:</label>
                    <div className="col-span-3">{selectedAccount.supplierName}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Descrição:</label>
                    <div className="col-span-3">{selectedAccount.description}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Valor:</label>
                    <div className="col-span-3">{formatCurrency(parseFloat(selectedAccount.amount))}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Vencimento:</label>
                    <div className="col-span-3">{formatDate(selectedAccount.dueDate)}</div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Status:</label>
                    <div className="col-span-3">
                      <Badge variant={getStatusVariant(selectedAccount.status)}>
                        {getStatusLabel(selectedAccount.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Categoria:</label>
                    <div className="col-span-3">
                      {selectedAccount.category ? getCategoryLabel(selectedAccount.category) : '-'}
                    </div>
                  </div>
                  
                  {selectedAccount.projectId && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right font-medium">Projeto:</label>
                      <div className="col-span-3">{getProjectName(selectedAccount.projectId)}</div>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de Edição */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Conta a Pagar</DialogTitle>
                <DialogDescription>
                  Modifique as informações da conta selecionada
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Fornecedor</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da empresa ou pessoa" />
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
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
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
                              <SelectItem value="approved">Aprovado</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="administrative">Administrativo</SelectItem>
                              <SelectItem value="project">Projeto</SelectItem>
                              <SelectItem value="operational">Operacional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campo condicional de projeto para edição */}
                    {watchEditCategory === 'project' && (
                      <FormField
                        control={editForm.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projeto</FormLabel>
                            <Popover open={editProjectComboboxOpen} onOpenChange={setEditProjectComboboxOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={editProjectComboboxOpen}
                                    className="w-full justify-between"
                                  >
                                    {field.value
                                      ? projects.find((project: any) => project.id === field.value)?.name
                                      : "Selecione um projeto..."}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar projeto..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {projects.map((project: any) => (
                                        <CommandItem
                                          key={project.id}
                                          value={project.name}
                                          onSelect={() => {
                                            editForm.setValue('projectId', project.id);
                                            setEditProjectComboboxOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              field.value === project.id ? "opacity-100" : "opacity-0"
                                            }`}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{project.name}</span>
                                            <span className="text-sm text-muted-foreground truncate">
                                              {project.description}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrição da despesa" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredAccounts.length} contas registradas
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
                {formatCurrency(pendingAccounts.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0))} aguardando
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
                Requer atenção urgente
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(paidAccounts.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0))} quitado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por descrição ou fornecedor..."
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
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contas a Pagar</CardTitle>
            <CardDescription>
              Histórico completo de despesas da organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece registrando a primeira conta a pagar'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fornecedor</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Projeto</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account: any) => (
                      <tr key={account.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{account.supplierName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-48 truncate">{account.description}</div>
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
                          <div className="max-w-24 truncate">
                            {account.category ? getCategoryLabel(account.category) : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-32 truncate">
                            {account.projectId ? getProjectName(account.projectId) : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewAccount(account)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditAccount(account)}>
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