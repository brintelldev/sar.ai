import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Shield, Heart, Eye, Edit, Calendar, Phone, MapPin, AlertTriangle, Filter, CalendarDays, CheckCircle2, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBeneficiarySchema, type Beneficiary } from '@/../../shared/schema';
import { useBeneficiaries, useCreateBeneficiary } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate, getInitials, formatRelativeTime } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    status: [] as string[],
    dateRange: 'all' as 'all' | 'last30' | 'last90' | 'thisYear',
    hasEmail: 'all' as 'all' | 'yes' | 'no',
    hasContact: 'all' as 'all' | 'yes' | 'no'
  });
  const { toast } = useToast();

  const { data: beneficiaries = [], isLoading } = useBeneficiaries() as { data: Beneficiary[], isLoading: boolean };
  const createBeneficiaryMutation = useCreateBeneficiary();

  // Hook para buscar código gerado automaticamente
  const { data: generatedCode, isLoading: isGeneratingCode } = useQuery({
    queryKey: ['/api/beneficiaries/generate-code'],
    enabled: isDialogOpen, // Só buscar quando o modal estiver aberto
    staleTime: 0, // Sempre buscar novo código
    gcTime: 0, // Não fazer cache (TanStack Query v5)
  });

  // Mutation para atualizar beneficiário
  const updateBeneficiaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/beneficiaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar beneficiário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Beneficiário atualizado",
        description: "As informações foram salvas com sucesso.",
      });
      setIsEditDialogOpen(false);
      setSelectedBeneficiary(null);
      // Invalidar cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/beneficiaries'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertBeneficiarySchema.extend({
      name: insertBeneficiarySchema.shape.name.min(1, 'Nome é obrigatório'),
      registrationNumber: insertBeneficiarySchema.shape.registrationNumber.min(1, 'Código de beneficiário é obrigatório'),
    })),
    defaultValues: {
      name: '',
      registrationNumber: '',
      email: '',
      document: '',
      birthDate: '',
      address: '',
      contactInfo: '',
      emergencyContact: '',
      needs: '',
      servicesReceived: '',
      status: 'active',
    },
  });

  // Preencher automaticamente o código de atendimento quando gerado
  React.useEffect(() => {
    if (generatedCode && typeof generatedCode === 'object' && 'registrationNumber' in generatedCode && isDialogOpen) {
      form.setValue('registrationNumber', generatedCode.registrationNumber as string);
    }
  }, [generatedCode, isDialogOpen, form]);

  // Formulário separado para edição
  const editForm = useForm({
    resolver: zodResolver(insertBeneficiarySchema.extend({
      name: insertBeneficiarySchema.shape.name.min(1, 'Nome é obrigatório'),
      registrationNumber: insertBeneficiarySchema.shape.registrationNumber.min(1, 'Código de beneficiário é obrigatório'),
    })),
    defaultValues: {
      name: '',
      registrationNumber: '',
      email: '',
      document: '',
      birthDate: '',
      address: '',
      contactInfo: '',
      emergencyContact: '',
      needs: '',
      servicesReceived: '',
      status: 'active',
    },
  });

  // Lógica de filtros
  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    // Filtro de busca por texto
    const matchesSearch = searchTerm === '' || 
      beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por status
    const matchesStatus = filters.status.length === 0 || 
      filters.status.includes(beneficiary.status || 'active');

    // Filtro por email
    const matchesEmail = filters.hasEmail === 'all' ||
      (filters.hasEmail === 'yes' && beneficiary.email && beneficiary.email.trim() !== '') ||
      (filters.hasEmail === 'no' && (!beneficiary.email || beneficiary.email.trim() === ''));

    // Filtro por contato
    const matchesContact = filters.hasContact === 'all' ||
      (filters.hasContact === 'yes' && beneficiary.contactInfo && beneficiary.contactInfo.trim() !== '') ||
      (filters.hasContact === 'no' && (!beneficiary.contactInfo || beneficiary.contactInfo.trim() === ''));

    // Filtro por data
    let matchesDate = true;
    if (filters.dateRange !== 'all' && beneficiary.createdAt) {
      const beneficiaryDate = new Date(beneficiary.createdAt);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'last30':
          const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = beneficiaryDate >= last30Days;
          break;
        case 'last90':
          const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDate = beneficiaryDate >= last90Days;
          break;
        case 'thisYear':
          const thisYear = now.getFullYear();
          matchesDate = beneficiaryDate.getFullYear() === thisYear;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesEmail && matchesContact && matchesDate;
  });

  // Contagem de filtros ativos
  const activeFiltersCount = 
    filters.status.length + 
    (filters.hasEmail !== 'all' ? 1 : 0) + 
    (filters.hasContact !== 'all' ? 1 : 0) + 
    (filters.dateRange !== 'all' ? 1 : 0);

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({
      status: [],
      dateRange: 'all',
      hasEmail: 'all',
      hasContact: 'all'
    });
  };

  const onSubmit = async (data: any) => {
    try {
      const result = await createBeneficiaryMutation.mutateAsync(data);
      
      let message = 'Pessoa cadastrada com sucesso.';
      if (data.email) {
        if (result.userAccountCreated) {
          message += ' Uma conta de acesso aos cursos foi criada automaticamente.';
        } else {
          message += ' Email já possui conta de usuário na organização.';
        }
      } else {
        message += ' Para acessar cursos, adicione um email posteriormente.';
      }
      
      toast({
        title: 'Cadastro realizado',
        description: message,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao realizar cadastro',
        description: 'Não foi possível completar o cadastro. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setIsDetailDialogOpen(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    // Preencher o formulário de edição com os dados atuais
    editForm.reset({
      name: beneficiary.name || '',
      registrationNumber: beneficiary.registrationNumber || '',
      email: beneficiary.email || '',
      document: beneficiary.document || '',
      birthDate: beneficiary.birthDate || '',
      address: beneficiary.address || '',
      contactInfo: beneficiary.contactInfo || '',
      emergencyContact: beneficiary.emergencyContact || '',
      needs: beneficiary.needs || '',
      servicesReceived: beneficiary.servicesReceived || '',
      status: beneficiary.status || 'active',
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: any) => {
    if (!selectedBeneficiary) return;
    
    try {
      await updateBeneficiaryMutation.mutateAsync({
        id: selectedBeneficiary.id,
        data: data
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Beneficiários</h1>
            <p className="text-base text-muted-foreground">
              Gestão compassiva e segura dos beneficiários acolhidos pela organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Acolhimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Acolhimento</DialogTitle>
                <DialogDescription>
                  Registro confidencial de um novo beneficiário em nosso programa de apoio. 
                  Todas as informações são protegidas pela LGPD.
                </DialogDescription>
              </DialogHeader>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Este cadastro é confidencial e seguro. Apenas pessoas autorizadas têm acesso a essas informações.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                      <TabsTrigger value="contact">Contato</TabsTrigger>
                      <TabsTrigger value="support">Apoio Necessário</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome ou Nome Social *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome pelo qual prefere ser chamada" />
                              </FormControl>
                              <FormDescription>
                                Use o nome pelo qual a pessoa se sente confortável
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de Beneficiário *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  readOnly
                                  disabled
                                  placeholder={isGeneratingCode ? "Gerando código..." : "Código gerado automaticamente"}
                                  className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento (opcional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormDescription>
                                Informação opcional para melhor atendimento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="document"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF (opcional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Apenas se desejar informar" />
                              </FormControl>
                              <FormDescription>
                                Informação opcional e protegida
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status do Atendimento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Em Atendimento</SelectItem>
                                <SelectItem value="inactive">Pausa no Atendimento</SelectItem>
                                <SelectItem value="completed">Atendimento Concluído</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (para acesso aos cursos)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="email@exemplo.com" />
                            </FormControl>
                            <FormDescription>
                              Email para criar conta e acessar cursos de capacitação (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contato Principal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Telefone, WhatsApp ou outro contato" />
                            </FormControl>
                            <FormDescription>
                              Como podemos entrar em contato de forma segura
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contato de Confiança</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome e telefone de pessoa de confiança" />
                            </FormControl>
                            <FormDescription>
                              Pessoa de confiança para emergências (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço de Referência (opcional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Local seguro para correspondência ou referência" />
                            </FormControl>
                            <FormDescription>
                              Apenas se necessário e se for seguro compartilhar
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="support" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="needs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipos de Apoio Necessário</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} placeholder="Descreva os tipos de apoio que podem ser úteis (psicológico, jurídico, social, etc.)" />
                            </FormControl>
                            <FormDescription>
                              Informações que nos ajudam a oferecer o melhor acolhimento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="servicesReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Histórico de Atendimentos</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Breve histórico de serviços já recebidos (opcional)" />
                            </FormControl>
                            <FormDescription>
                              Ajuda a continuidade do cuidado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createBeneficiaryMutation.isPending}>
                      {createBeneficiaryMutation.isPending ? 'Salvando...' : 'Confirmar Cadastro'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar with Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código de beneficiário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Filter Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Filtros</h3>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status do Atendimento</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'active', label: 'Em Atendimento', icon: CheckCircle2, color: 'text-blue-600' },
                        { value: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'text-green-600' },
                        { value: 'inactive', label: 'Pausado', icon: Clock, color: 'text-gray-600' }
                      ].map(status => {
                        const Icon = status.icon;
                        return (
                          <div key={status.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status.value}`}
                              checked={filters.status.includes(status.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: [...prev.status, status.value]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(s => s !== status.value)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`status-${status.value}`} className="flex items-center gap-2 cursor-pointer">
                              <Icon className={`h-4 w-4 ${status.color}`} />
                              {status.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Período de Cadastro</Label>
                    <Select value={filters.dateRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="last30">Últimos 30 dias</SelectItem>
                        <SelectItem value="last90">Últimos 90 dias</SelectItem>
                        <SelectItem value="thisYear">Este ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Email Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Possui Email</Label>
                    <Select value={filters.hasEmail} onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasEmail: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="yes">Com email</SelectItem>
                        <SelectItem value="no">Sem email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Contact Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Possui Contato</Label>
                    <Select value={filters.hasContact} onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasContact: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="yes">Com contato</SelectItem>
                        <SelectItem value="no">Sem contato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredBeneficiaries.length} de {beneficiaries.length} resultados</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Acolhidas</CardTitle>
              <Heart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beneficiaries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {beneficiaries.filter(b => b.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acompanhamentos Concluídos</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {beneficiaries.filter(b => b.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {beneficiaries.filter(b => {
                  if (!b.createdAt) return false;
                  const createdAt = new Date(b.createdAt);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beneficiaries List */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Beneficiários em Acompanhamento</CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Lista confidencial de beneficiários acolhidos em nossos programas
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredBeneficiaries.length} registros
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando...</p>
              </div>
            ) : filteredBeneficiaries.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum beneficiário encontrado' : 'Nenhum acolhimento registrado'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {searchTerm ? 'Tente ajustar os termos da busca.' : 'Quando houver novos acolhimentos, eles aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredBeneficiaries.map((beneficiary) => (
                  <div key={beneficiary.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-pink-100 text-pink-700 font-medium">
                            {getInitials(beneficiary.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{beneficiary.name}</h3>
                            <Badge variant={
                              beneficiary.status === 'active' ? 'default' :
                              beneficiary.status === 'completed' ? 'secondary' : 'outline'
                            } className={
                              beneficiary.status === 'active' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' :
                              beneficiary.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''
                            }>
                              {beneficiary.status === 'active' ? 'Em Atendimento' :
                               beneficiary.status === 'completed' ? 'Concluído' : 'Pausado'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Código: {beneficiary.registrationNumber}
                          </p>
                          {beneficiary.createdAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Acolhimento iniciado {formatRelativeTime(beneficiary.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(beneficiary)} className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditBeneficiary(beneficiary)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Acolhimento</DialogTitle>
              <DialogDescription>
                Informações confidenciais protegidas pela LGPD
              </DialogDescription>
            </DialogHeader>
            {selectedBeneficiary && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-pink-100 text-pink-700 text-lg">
                      {getInitials(selectedBeneficiary.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedBeneficiary.name}</h3>
                    <p className="text-muted-foreground">Código: {selectedBeneficiary.registrationNumber}</p>
                    <Badge variant={
                      selectedBeneficiary.status === 'active' ? 'default' :
                      selectedBeneficiary.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {selectedBeneficiary.status === 'active' ? 'Em Atendimento' :
                       selectedBeneficiary.status === 'completed' ? 'Concluído' : 'Pausado'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  {selectedBeneficiary.contactInfo && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contato</p>
                        <p className="text-sm text-muted-foreground">{selectedBeneficiary.contactInfo}</p>
                      </div>
                    </div>
                  )}

                  {selectedBeneficiary.emergencyContact && (
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contato de Confiança</p>
                        <p className="text-sm text-muted-foreground">{selectedBeneficiary.emergencyContact}</p>
                      </div>
                    </div>
                  )}

                  {selectedBeneficiary.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Endereço de Referência</p>
                        <p className="text-sm text-muted-foreground">{selectedBeneficiary.address}</p>
                      </div>
                    </div>
                  )}

                  {selectedBeneficiary.needs && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tipos de Apoio Necessário</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {selectedBeneficiary.needs}
                      </p>
                    </div>
                  )}

                  {selectedBeneficiary.servicesReceived && (
                    <div>
                      <p className="text-sm font-medium mb-2">Histórico de Atendimentos</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {selectedBeneficiary.servicesReceived}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      Cadastro criado em {selectedBeneficiary.createdAt ? formatDate(selectedBeneficiary.createdAt) : 'Data não disponível'}
                    </p>
                    {selectedBeneficiary.updatedAt && selectedBeneficiary.updatedAt !== selectedBeneficiary.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Última atualização em {formatDate(selectedBeneficiary.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Beneficiário</DialogTitle>
              <DialogDescription>
                Atualize as informações do beneficiário com cuidado e respeitando a privacidade
              </DialogDescription>
            </DialogHeader>
            {selectedBeneficiary && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                      <TabsTrigger value="contact">Contato</TabsTrigger>
                      <TabsTrigger value="support">Acompanhamento</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome da pessoa" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de Beneficiário *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  readOnly
                                  className="bg-gray-50 dark:bg-gray-800"
                                  placeholder="Código não pode ser alterado"
                                />
                              </FormControl>
                              <FormDescription>
                                Código gerado automaticamente - não pode ser alterado
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="document"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documento de Identificação</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="RG, CPF ou outro documento (opcional)" />
                              </FormControl>
                              <FormDescription>
                                Apenas se necessário para atendimento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormDescription>
                                Para adequar atendimento por faixa etária
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status do Atendimento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Em Atendimento</SelectItem>
                                <SelectItem value="inactive">Pausa no Atendimento</SelectItem>
                                <SelectItem value="completed">Atendimento Concluído</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (para acesso aos cursos)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="email@exemplo.com" />
                            </FormControl>
                            <FormDescription>
                              Email para criar conta e acessar cursos de capacitação (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contato Principal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Telefone, WhatsApp ou outro contato" />
                            </FormControl>
                            <FormDescription>
                              Como podemos entrar em contato de forma segura
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contato de Confiança</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome e telefone de pessoa de confiança" />
                            </FormControl>
                            <FormDescription>
                              Pessoa de confiança para emergências (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço de Referência (opcional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Local seguro para correspondência ou referência" />
                            </FormControl>
                            <FormDescription>
                              Apenas se necessário e se for seguro compartilhar
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="support" className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="needs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipos de Apoio Necessário</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} placeholder="Descreva os tipos de apoio que podem ser úteis (psicológico, jurídico, social, etc.)" />
                            </FormControl>
                            <FormDescription>
                              Informações que nos ajudam a oferecer o melhor acolhimento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="servicesReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Histórico de Atendimentos</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Breve histórico de serviços já recebidos (opcional)" />
                            </FormControl>
                            <FormDescription>
                              Ajuda a continuidade do cuidado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateBeneficiaryMutation.isPending}>
                      {updateBeneficiaryMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}