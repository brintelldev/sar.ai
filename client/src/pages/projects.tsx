import { useState } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, Users, Target, Edit, Eye, X, CheckSquare, Square } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [milestonesList, setMilestonesList] = useState<Array<{id: string, text: string, completed: boolean}>>([]);
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const createForm = useForm({
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
      milestones: '[]',
    }
  });

  const editForm = useForm({
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
      milestones: '[]',
    }
  });

  const onCreateSubmit = async (data: any) => {
    try {
      // Remove organizationId from data since it's added automatically by the backend
      const { organizationId, ...projectData } = data;
      console.log('Creating project with data:', projectData);
      await createProjectMutation.mutateAsync(projectData);
      toast({
        title: "Projeto criado com sucesso",
        description: "O novo projeto foi adicionado ao sistema.",
      });
      setIsDialogOpen(false);
      createForm.reset();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao criar projeto",
        description: "Ocorreu um erro ao salvar o projeto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onEditSubmit = async (data: any) => {
    try {
      console.log('Updating project with data:', data, 'project id:', selectedProject?.id);
      await updateProjectMutation.mutateAsync({ id: selectedProject.id, data });
      toast({
        title: "Projeto atualizado com sucesso",
        description: "As alterações foram salvas no sistema.",
      });
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro ao atualizar projeto",
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
    editForm.reset({
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
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
              
              <Form {...createForm}>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  console.log('Create form submit triggered');
                  const isValid = await createForm.trigger();
                  console.log('Form validation result:', isValid);
                  console.log('Form errors:', createForm.formState.errors);
                  if (isValid) {
                    const formData = createForm.getValues();
                    console.log('Form data:', formData);
                    onCreateSubmit(formData);
                  } else {
                    console.log('Form has validation errors, not submitting');
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Objetivos</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Defina os objetivos principais do projeto" />
                          </FormControl>
                          <FormDescription>
                            Descreva os resultados esperados do projeto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-2">
                      <FormLabel>Marcos e Etapas</FormLabel>
                      <div className="space-y-3 mt-2">
                        {milestonesList.map((milestone, index) => (
                          <div key={milestone.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={milestone.completed}
                              onCheckedChange={(checked) => {
                                const updated = [...milestonesList];
                                updated[index].completed = !!checked;
                                setMilestonesList(updated);
                                createForm.setValue('milestones', JSON.stringify(updated));
                              }}
                            />
                            <Input
                              value={milestone.text}
                              onChange={(e) => {
                                const updated = [...milestonesList];
                                updated[index].text = e.target.value;
                                setMilestonesList(updated);
                                createForm.setValue('milestones', JSON.stringify(updated));
                              }}
                              placeholder="Digite o marco/etapa"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = milestonesList.filter((_, i) => i !== index);
                                setMilestonesList(updated);
                                createForm.setValue('milestones', JSON.stringify(updated));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMilestone = {
                              id: Date.now().toString(),
                              text: '',
                              completed: false
                            };
                            const updated = [...milestonesList, newMilestone];
                            setMilestonesList(updated);
                            createForm.setValue('milestones', JSON.stringify(updated));
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Marco
                        </Button>
                      </div>
                      <FormDescription>
                        Principais entregas e pontos de controle do projeto
                      </FormDescription>
                    </div>
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

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
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
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros para encontrar o que procura.' 
                : 'Comece criando seu primeiro projeto para gerenciar as atividades da organização.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            )}
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
                  <p className="text-sm">{selectedProject.description}</p>
                </div>

                {selectedProject.goals && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Objetivos</h4>
                    <p className="text-sm">{selectedProject.goals}</p>
                  </div>
                )}

                {selectedProject.milestones && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Marcos e Etapas</h4>
                    <p className="text-sm">{selectedProject.milestones}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedProject.startDate && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Início</h4>
                      <p className="text-sm">{formatDate(selectedProject.startDate)}</p>
                    </div>
                  )}
                  {selectedProject.endDate && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Término</h4>
                      <p className="text-sm">{formatDate(selectedProject.endDate)}</p>
                    </div>
                  )}
                </div>

                {selectedProject.budget && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Orçamento</h4>
                      <p className="text-sm font-medium">{formatCurrency(selectedProject.budget)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Valor Gasto</h4>
                      <p className="text-sm">{formatCurrency(selectedProject.spentAmount || 0)}</p>
                    </div>
                  </div>
                )}
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
            
            <Form {...editForm}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                console.log('Edit form submit triggered');
                const isValid = await editForm.trigger();
                console.log('Edit form validation result:', isValid);
                console.log('Edit form errors:', editForm.formState.errors);
                if (isValid) {
                  const formData = editForm.getValues();
                  console.log('Edit form data:', formData);
                  onEditSubmit(formData);
                } else {
                  console.log('Edit form has validation errors, not submitting');
                }
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
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
                    control={editForm.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Objetivos</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Defina os objetivos principais do projeto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
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
                  <Button type="submit" disabled={updateProjectMutation.isPending}>
                    {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
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