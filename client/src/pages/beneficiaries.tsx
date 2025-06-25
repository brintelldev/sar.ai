import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Shield, Heart, Eye, Edit, Calendar, Phone, MapPin, AlertTriangle } from 'lucide-react';
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

export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: beneficiaries = [], isLoading } = useBeneficiaries() as { data: Beneficiary[], isLoading: boolean };
  const createBeneficiaryMutation = useCreateBeneficiary();

  const form = useForm({
    resolver: zodResolver(insertBeneficiarySchema.extend({
      name: insertBeneficiarySchema.shape.name.min(1, 'Nome é obrigatório'),
      registrationNumber: insertBeneficiarySchema.shape.registrationNumber.min(1, 'Código de atendimento é obrigatório'),
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

  const filteredBeneficiaries = beneficiaries.filter(beneficiary =>
    beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    beneficiary.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: any) => {
    try {
      await createBeneficiaryMutation.mutateAsync(data);
      const message = data.email 
        ? 'Pessoa cadastrada com sucesso. Uma conta de acesso aos cursos foi criada automaticamente.'
        : 'Pessoa cadastrada com sucesso. Para acessar cursos, adicione um email posteriormente.';
      
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Beneficiários</h1>
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
                              <FormLabel>Nome ou Nome Social</FormLabel>
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
                              <FormLabel>Código de Atendimento</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ex: AT-2024-001" />
                              </FormControl>
                              <FormDescription>
                                Código único para identificação interna
                              </FormDescription>
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

        {/* Search Bar */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código de atendimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
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
              <div className="text-2xl font-bold text-blue-600">
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
              <div className="text-2xl font-bold text-green-600">
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
              <div className="text-2xl font-bold text-purple-600">
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
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Beneficiários em Acompanhamento</CardTitle>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
      </div>
    </MainLayout>
  );
}