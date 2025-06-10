import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Plus, Building2, DollarSign, Users, Calendar, Search, Filter, Eye, Edit, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const insertFunderSchema = z.object({
  name: z.string().min(1, 'Nome do financiador é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  contactEmail: z.string().email('Email válido é obrigatório'),
  contactPhone: z.string().optional(),
  focusAreas: z.string().optional(),
  requirements: z.string().optional(),
  totalFunding: z.string().min(1, 'Valor total de financiamento é obrigatório'),
  status: z.string().default('active'),
  partnershipStart: z.string().optional(),
  contractPeriod: z.string().optional(),
});

export default function Funders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: funders, isLoading } = useQuery({
    queryKey: ['/api/funders'],
  });

  const createFunderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/funders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funders'] });
      toast({
        title: "Financiador registrado",
        description: "O novo financiador foi adicionado ao sistema.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao registrar financiador",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertFunderSchema),
    defaultValues: {
      name: '',
      type: '',
      contactEmail: '',
      contactPhone: '',
      focusAreas: '',
      requirements: '',
      totalFunding: '',
      status: 'active',
      partnershipStart: '',
      contractPeriod: '',
    }
  });

  const onSubmit = async (data: any) => {
    await createFunderMutation.mutateAsync(data);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'suspended': 'Suspenso',
      'expired': 'Expirado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'government': 'Governo',
      'foundation': 'Fundação',
      'corporate': 'Corporativo',
      'international': 'Internacional',
      'individual': 'Individual'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredFunders = Array.isArray(funders) ? funders.filter((funder: any) => {
    const matchesSearch = funder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funder.focusAreas?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || funder.status === statusFilter;
    const matchesType = typeFilter === 'all' || funder.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  const totalFunding = filteredFunders.reduce((sum: number, funder: any) => 
    sum + parseFloat(funder.totalFunding || 0), 0
  );

  const activeFunders = filteredFunders.filter((f: any) => f.status === 'active');
  const pendingFunders = filteredFunders.filter((f: any) => f.status === 'pending');
  const expiredFunders = filteredFunders.filter((f: any) => f.status === 'expired');

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
            <h1 className="text-3xl font-bold text-foreground">Financiadores</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie parcerias e financiamentos da organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Financiador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Novo Financiador</DialogTitle>
                <DialogDescription>
                  Adicione um novo financiador ou parceiro ao sistema.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Financiador</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da organização" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="government">Governo</SelectItem>
                              <SelectItem value="foundation">Fundação</SelectItem>
                              <SelectItem value="corporate">Corporativo</SelectItem>
                              <SelectItem value="international">Internacional</SelectItem>
                              <SelectItem value="individual">Individual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Contato</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="contato@financiador.org.br" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(11) 99999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalFunding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total de Financiamento (R$)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0,00" />
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
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="suspended">Suspenso</SelectItem>
                              <SelectItem value="expired">Expirado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partnershipStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início da Parceria</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período do Contrato</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 12 meses, 2 anos" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="focusAreas"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Áreas de Foco</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva as áreas de interesse do financiador" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Requisitos e Critérios</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Requisitos específicos para recebimento de financiamento" />
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
                    <Button type="submit" disabled={createFunderMutation.isPending}>
                      {createFunderMutation.isPending ? 'Salvando...' : 'Registrar Financiador'}
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
              <CardTitle className="text-sm font-medium">Total de Financiamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalFunding)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredFunders.length} financiadores registrados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFunders.length}</div>
              <p className="text-xs text-muted-foreground">
                Parcerias em andamento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFunders.length}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredFunders.length}</div>
              <p className="text-xs text-muted-foreground">
                Contratos vencidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou área de foco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="government">Governo</SelectItem>
                <SelectItem value="foundation">Fundação</SelectItem>
                <SelectItem value="corporate">Corporativo</SelectItem>
                <SelectItem value="international">Internacional</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Funders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Financiadores</CardTitle>
            <CardDescription>
              Registro completo de financiadores e parcerias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFunders.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum financiador encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece registrando o primeiro financiador'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor Total</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contato</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Área de Foco</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFunders.map((funder: any) => (
                      <tr key={funder.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{funder.name}</div>
                          {funder.partnershipStart && (
                            <div className="text-xs text-muted-foreground">
                              Desde {formatDate(funder.partnershipStart)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-24 truncate">
                            {getTypeLabel(funder.type)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatCurrency(parseFloat(funder.totalFunding))}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(funder.status)}>
                            {getStatusLabel(funder.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{funder.contactEmail}</div>
                          {funder.contactPhone && (
                            <div className="text-xs text-muted-foreground">{funder.contactPhone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-32 truncate text-sm">
                            {funder.focusAreas || '-'}
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