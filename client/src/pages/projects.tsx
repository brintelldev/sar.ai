import { useState } from 'react';
import * as React from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, Users, Target, Edit, Eye, X, CheckSquare, Square, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/use-organization';
import { insertProjectSchema } from '@/../../shared/schema';
import { useToast } from '@/hooks/use-toast';

// Component to view and edit milestones in project details
function MilestonesViewer({ project, onUpdate }: { project: any, onUpdate: (project: any) => void }) {
  const [milestones, setMilestones] = useState<Array<{id: string, text: string, completed: boolean}>>([]);
  const updateProjectMutation = useUpdateProject();

  React.useEffect(() => {
    try {
      const parsedMilestones = typeof project.milestones === 'string' 
        ? JSON.parse(project.milestones) 
        : project.milestones || [];
      setMilestones(Array.isArray(parsedMilestones) ? parsedMilestones : []);
    } catch {
      setMilestones([]);
    }
  }, [project.milestones]);

  const handleToggleMilestone = async (index: number) => {
    const updated = [...milestones];
    updated[index].completed = !updated[index].completed;
    setMilestones(updated);

    // Update project in database
    const updatedProject = {
      ...project,
      milestones: JSON.stringify(updated)
    };

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: updatedProject
      });
      onUpdate(updatedProject);
    } catch (error) {
      // Revert on error
      setMilestones(milestones);
    }
  };

  if (!milestones.length) {
    return <p className="text-sm text-muted-foreground">Nenhum marco definido</p>;
  }

  return (
    <div className="space-y-2">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="flex items-center gap-3 p-2 border rounded">
          <Checkbox
            checked={milestone.completed}
            onCheckedChange={() => handleToggleMilestone(index)}
          />
          <span className={`text-sm flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
            {milestone.text}
          </span>
        </div>
      ))}
      <div className="mt-2 text-xs text-muted-foreground">
        {milestones.filter(m => m.completed).length} de {milestones.length} marcos concluídos
      </div>
    </div>
  );
}

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [milestonesList, setMilestonesList] = useState<Array<{id: string, text: string, completed: boolean}>>([]);
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

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
      // Reset form to default values
      createForm.reset({
        name: '',
        description: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        budget: '',
        spentAmount: '0',
        goals: '',
        milestones: '[]',
      });
      // Reset milestones list
      setMilestonesList([]);
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

  const onDeleteProject = async (projectId: string) => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      toast({
        title: "Projeto excluído com sucesso!",
        description: "O projeto foi removido da sua organização.",
      });
    } catch (error) {
      console.error('Delete project error:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Ocorreu um erro ao excluir o projeto. Tente novamente.",
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
    try {
      const milestones = typeof project.milestones === 'string' 
        ? JSON.parse(project.milestones) 
        : project.milestones || [];
      
      if (!Array.isArray(milestones) || milestones.length === 0) {
        // Fallback to budget-based progress if no milestones
        if (!project.budget || !project.spentAmount) return 0;
        return Math.round((parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100);
      }
      
      const completedCount = milestones.filter(m => m.completed).length;
      return Math.round((completedCount / milestones.length) * 100);
    } catch {
      // Fallback to budget-based progress on error
      if (!project.budget || !project.spentAmount) return 0;
      return Math.round((parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100);
    }
  };

  const openDetailDialog = (project: any) => {
    setSelectedProject(project);
    setIsDetailDialogOpen(true);
  };

  const openEditDialog = (project: any) => {
    setSelectedProject(project);
    
    // Parse milestones for editing
    try {
      const milestones = Array.isArray(project.milestones) 
        ? project.milestones 
        : (typeof project.milestones === 'string' ? JSON.parse(project.milestones) : []);
      setMilestonesList(Array.isArray(milestones) ? milestones : []);
    } catch {
      setMilestonesList([]);
    }
    
    editForm.reset({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      spentAmount: project.spentAmount || '0',
      goals: project.goals || '',
      milestones: JSON.stringify(project.milestones || []),
    });
    setIsEditDialogOpen(true);
  };

  const filteredProjects = Array.isArray(projects) ? projects.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    // Budget filter
    let matchesBudget = true;
    if (budgetFilter !== 'all') {
      const budget = parseFloat(project.budget) || 0;
      switch (budgetFilter) {
        case 'low':
          matchesBudget = budget <= 10000;
          break;
        case 'medium':
          matchesBudget = budget > 10000 && budget <= 50000;
          break;
        case 'high':
          matchesBudget = budget > 50000;
          break;
      }
    }

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      
      switch (dateFilter) {
        case 'current':
          matchesDate = startDate <= now && endDate >= now;
          break;
        case 'upcoming':
          matchesDate = startDate > now;
          break;
        case 'past':
          matchesDate = endDate < now;
          break;
        case 'thisYear':
          matchesDate = startDate.getFullYear() === now.getFullYear() || endDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesBudget && matchesDate;
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              // Reset form when opening the dialog
              createForm.reset({
                name: '',
                description: '',
                status: 'planning',
                startDate: '',
                endDate: '',
                budget: '',
                spentAmount: '0',
                goals: '',
                milestones: '[]',
              });
              setMilestonesList([]);
            }
          }}>
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


        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Em Andamento</SelectItem>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Orçamento</label>
                <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Orçamentos</SelectItem>
                    <SelectItem value="low">Até R$ 10.000</SelectItem>
                    <SelectItem value="medium">R$ 10.001 - R$ 50.000</SelectItem>
                    <SelectItem value="high">Acima de R$ 50.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Período</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="current">Em Andamento Agora</SelectItem>
                    <SelectItem value="upcoming">Futuros</SelectItem>
                    <SelectItem value="past">Finalizados</SelectItem>
                    <SelectItem value="thisYear">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'all' || budgetFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setBudgetFilter('all');
                    setDateFilter('all');
                    setSearchTerm('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Todos os Filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {statusFilter === 'active' ? 'Em Andamento' : 
                      statusFilter === 'planning' ? 'Planejamento' :
                      statusFilter === 'completed' ? 'Concluído' :
                      statusFilter === 'paused' ? 'Pausado' : 'Cancelado'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setStatusFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {budgetFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Orçamento: {budgetFilter === 'low' ? 'Até R$ 10k' :
                         budgetFilter === 'medium' ? 'R$ 10k-50k' : 'Acima R$ 50k'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setBudgetFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {dateFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Período: {dateFilter === 'current' ? 'Atual' :
                       dateFilter === 'upcoming' ? 'Futuros' :
                       dateFilter === 'past' ? 'Finalizados' : 'Este Ano'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setDateFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Busca: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' || budgetFilter !== 'all' || dateFilter !== 'all' ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' || budgetFilter !== 'all' || dateFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar o que procura.' 
                : 'Comece criando seu primeiro projeto para gerenciar as atividades da organização.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && budgetFilter === 'all' && dateFilter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredProjects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground leading-tight text-sm md:text-base flex-1 min-w-0">
                      {project.name}
                    </h3>
                    <Badge className={`status-badge ${getStatusVariant(project.status)} flex-shrink-0 text-xs`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <p className="text-xs md:text-sm text-muted-foreground mb-4 line-clamp-2 flex-shrink-0">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 md:space-y-3 flex-1">
                    {/* Dates */}
                    {project.startDate && project.endDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs md:text-sm text-muted-foreground truncate">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                      </div>
                    )}
                    
                    {/* Budget */}
                    {project.budget && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs md:text-sm text-muted-foreground truncate">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    )}
                    
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs md:text-sm text-muted-foreground">Progresso</span>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          {calculateProgress(project)}%
                        </span>
                      </div>
                      <Progress value={calculateProgress(project)} className="h-1.5 md:h-2" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openDetailDialog(project)} className="w-full">
                      <Eye className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)} className="flex-1">
                        <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive flex-1">
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Excluir</span>
                            <span className="sm:hidden">Del</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o projeto "{project.name}"?
                              <br /><br />
                              <strong>Esta ação não pode ser desfeita.</strong> Todos os dados do projeto, incluindo marcos, orçamento e histórico serão permanentemente removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDeleteProject(project.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, Excluir Projeto
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
                    <MilestonesViewer 
                      project={selectedProject} 
                      onUpdate={(updatedProject) => {
                        setSelectedProject(updatedProject);
                        // Update the project in the list
                        const updatedProjects = (projects || []).map((p: any) => 
                          p.id === updatedProject.id ? updatedProject : p
                        );
                        // You might want to trigger a mutation here to save changes
                      }}
                    />
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
              <div className="flex gap-2">
                <Button onClick={() => {
                  setIsDetailDialogOpen(false);
                  openEditDialog(selectedProject);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Projeto
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Projeto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o projeto "{selectedProject?.name}"?
                        <br /><br />
                        <strong>Esta ação não pode ser desfeita.</strong> Todos os dados do projeto, incluindo marcos, orçamento e histórico serão permanentemente removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          onDeleteProject(selectedProject?.id);
                          setIsDetailDialogOpen(false);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, Excluir Projeto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
                        <div className="space-y-3">
                          {/* Existing milestones */}
                          {milestonesList.map((milestone, index) => (
                            <div key={milestone.id || index} className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30 dark:bg-muted/10">
                              <Checkbox
                                checked={milestone.completed || false}
                                onCheckedChange={(checked) => {
                                  const newMilestones = [...milestonesList];
                                  newMilestones[index] = { ...milestone, completed: !!checked };
                                  setMilestonesList(newMilestones);
                                  field.onChange(JSON.stringify(newMilestones));
                                }}
                                className="w-5 h-5"
                              />
                              <Input
                                value={milestone.text || ''}
                                onChange={(e) => {
                                  const newMilestones = [...milestonesList];
                                  newMilestones[index] = { ...milestone, text: e.target.value };
                                  setMilestonesList(newMilestones);
                                  field.onChange(JSON.stringify(newMilestones));
                                }}
                                placeholder="Descrição do marco"
                                className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newMilestones = milestonesList.filter((_, i) => i !== index);
                                  setMilestonesList(newMilestones);
                                  field.onChange(JSON.stringify(newMilestones));
                                }}
                                className="text-muted-foreground hover:text-destructive p-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Add new milestone button */}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              const newMilestone = {
                                id: Date.now().toString(),
                                text: '',
                                completed: false
                              };
                              const newMilestones = [...milestonesList, newMilestone];
                              setMilestonesList(newMilestones);
                              field.onChange(JSON.stringify(newMilestones));
                            }}
                            className="w-fit flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Adicionar Marco</span>
                          </Button>
                          
                          <p className="text-sm text-muted-foreground mt-2">
                            Principais entregas e pontos de controle do projeto
                          </p>
                        </div>
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