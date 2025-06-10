import { useState } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, Users, Target, Edit, Eye, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/use-organization';
import { insertProjectSchema } from '@/../../shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      spentAmount: '0',
      goals: '',
      milestones: '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (selectedProject && isEditDialogOpen) {
        // Editando projeto existente
        await updateProjectMutation.mutateAsync({ id: selectedProject.id, data });
        toast({
          title: "Projeto atualizado com sucesso",
          description: "As alterações foram salvas no sistema.",
        });
        setIsEditDialogOpen(false);
      } else {
        // Criando novo projeto
        await createProjectMutation.mutateAsync(data);
        toast({
          title: "Projeto criado com sucesso",
          description: "O novo projeto foi adicionado ao sistema.",
        });
        setIsDialogOpen(false);
      }
      form.reset();
      setSelectedProject(null);
    } catch (error) {
      toast({
        title: selectedProject && isEditDialogOpen ? "Erro ao atualizar projeto" : "Erro ao criar projeto",
        description: "Ocorreu um erro ao salvar o projeto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'paused':
        return 'status-warning';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      case 'paused':
        return 'Pausado';
      case 'planning':
        return 'Planejamento';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const calculateProgress = (project: any) => {
    if (!project.budget || !project.spentAmount) return 0;
    return Math.round((parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100);
  };

  const openDetailDialog = (project: any) => {
    setSelectedProject(project);
    setIsDetailDialogOpen(true);
  };

  const openEditDialog = (project: any) => {
    setSelectedProject(project);
    form.reset({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      spentAmount: project.spentAmount || '0',
      goals: project.goals || '',
      milestones: project.milestones || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredProjects = Array.isArray(projects) ? projects.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todos os projetos da sua organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Adicione um novo projeto para gerenciar as atividades da organização.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Nome do Projeto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Digite o nome do projeto" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Descreva os objetivos e escopo do projeto" />
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
                              <SelectItem value="planning">Planejamento</SelectItem>
                              <SelectItem value="active">Em Andamento</SelectItem>
                              <SelectItem value="paused">Pausado</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orçamento (R$)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0,00" />
                          </FormControl>
                          <FormDescription>
                            Valor total previsto para o projeto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Objetivos e Metas</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Descreva os objetivos específicos do projeto" />
                          </FormControl>
                          <FormDescription>
                            Defina claramente o que o projeto pretende alcançar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="milestones"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Marcos e Etapas</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Liste os principais marcos do projeto" />
                          </FormControl>
                          <FormDescription>
                            Principais entregas e pontos de controle
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters && <X className="h-4 w-4 ml-2" />}
            </Button>
          </div>
          
          {showFilters && (
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Status:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="active">Em Andamento</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Projects Grid */}
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
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros.'
                  : 'Comece criando seu primeiro projeto para gerenciar as atividades da organização.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground leading-tight">
                      {project.name}
                    </h3>
                    <Badge className={`status-badge ${getStatusVariant(project.status)} ml-2`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3">
                    {/* Dates */}
                    {project.startDate && project.endDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                      </div>
                    )}
                    
                    {/* Budget */}
                    {project.budget && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    )}
                    
                    {/* Progress */}
                    {project.budget && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Progresso</span>
                          <span className="text-sm font-medium text-foreground">
                            {calculateProgress(project)}%
                          </span>
                        </div>
                        <Progress value={calculateProgress(project)} className="h-2" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" onClick={() => openDetailDialog(project)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Project Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject?.name}</DialogTitle>
              <DialogDescription>
                Detalhes completos do projeto
              </DialogDescription>
            </DialogHeader>
            
            {selectedProject && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                    <Badge className={`status-badge ${getStatusVariant(selectedProject.status)}`}>
                      {getStatusLabel(selectedProject.status)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Progresso</h4>
                    <div className="flex items-center space-x-2">
                      <Progress value={calculateProgress(selectedProject)} className="flex-1" />
                      <span className="text-sm font-medium">{calculateProgress(selectedProject)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
                  <p className="text-sm">{selectedProject.description || 'Sem descrição'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Início</h4>
                    <p className="text-sm">{selectedProject.startDate ? formatDate(selectedProject.startDate) : 'Não definida'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Término</h4>
                    <p className="text-sm">{selectedProject.endDate ? formatDate(selectedProject.endDate) : 'Não definida'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Orçamento</h4>
                    <p className="text-sm">{selectedProject.budget ? formatCurrency(selectedProject.budget) : 'Não definido'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Valor Utilizado</h4>
                    <p className="text-sm">{selectedProject.spentAmount ? formatCurrency(selectedProject.spentAmount) : 'R$ 0,00'}</p>
                  </div>
                </div>

                {selectedProject.goals && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Objetivos e Metas</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedProject.goals}</p>
                  </div>
                )}

                {selectedProject.milestones && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Marcos e Etapas</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedProject.milestones}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Criado em: {selectedProject.createdAt ? formatDate(selectedProject.createdAt) : 'Data não disponível'}</span>
                  </div>
                  <div>
                    <span>Última atualização: {selectedProject.updatedAt ? formatDate(selectedProject.updatedAt) : 'Data não disponível'}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                openEditDialog(selectedProject);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
              <DialogDescription>
                Atualize as informações do projeto.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome do Projeto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome do projeto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Descreva os objetivos e escopo do projeto" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">Planejamento</SelectItem>
                            <SelectItem value="active">Em Andamento</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orçamento (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0,00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Objetivos e Metas</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Descreva os objetivos específicos do projeto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="milestones"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Marcos e Etapas</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Liste os principais marcos do projeto" />
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
                  <Button type="submit" disabled={createProjectMutation.isPending || updateProjectMutation.isPending}>
                    {(createProjectMutation.isPending || updateProjectMutation.isPending) ? 'Salvando...' : 'Salvar Alterações'}
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
