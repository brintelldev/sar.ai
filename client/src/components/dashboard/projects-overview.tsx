import { Plus, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects } from '@/hooks/use-organization';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export function ProjectsOverview() {
  const { data: projects, isLoading, isFetching } = useProjects();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'paused':
        return 'status-warning';
      case 'overdue':
        return 'destructive';
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
      case 'overdue':
        return 'Atrasado';
      default:
        return status;
    }
  };

  const calculateProgress = (project: any) => {
    if (!project.budget || !project.spentAmount) return 0;
    const progress = Math.round((parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100);
    return Math.min(progress, 100); // Cap at 100%
  };

  // Calculate actual project metrics from milestones
  const calculateMilestoneProgress = (project: any) => {
    // Use server-calculated value if available
    if (project.calculatedCompletionRate !== undefined) {
      return project.calculatedCompletionRate;
    }
    
    // Fallback to client-side calculation
    if (!project.milestones || !Array.isArray(project.milestones) || project.milestones.length === 0) {
      return 0;
    }
    const completedMilestones = project.milestones.filter((m: any) => m.completed === true).length;
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };

  // Get dynamic project status based on dates and completion
  const getDynamicStatus = (project: any) => {
    const now = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    
    // If all milestones are completed, mark as completed
    const milestoneProgress = calculateMilestoneProgress(project);
    if (milestoneProgress === 100) {
      return 'completed';
    }
    
    // If past end date but not completed, mark as overdue
    if (endDate && now > endDate && project.status !== 'completed') {
      return 'overdue';
    }
    
    // If within date range and has started, mark as active
    if (startDate && now >= startDate && (!endDate || now <= endDate)) {
      return project.status === 'planning' ? 'active' : project.status;
    }
    
    return project.status;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Projetos em Andamento
              {isFetching && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe o progresso em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link href="/projects">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ver Todos
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!projects || projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum projeto encontrado</p>
            <Link href="/projects">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 3).map((project: any) => {
              const dynamicStatus = getDynamicStatus(project);
              const milestoneProgress = calculateMilestoneProgress(project);
              const budgetProgress = calculateProgress(project);
              const showMilestones = project.milestones && project.milestones.length > 0;
              
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="border border-border rounded-lg p-3 sm:p-4 hover:border-muted-foreground/50 transition-colors cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">{project.name}</h3>
                          <Badge className={`status-badge ${getStatusVariant(dynamicStatus)} self-start`}>
                            {getStatusLabel(dynamicStatus)}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-muted-foreground truncate">
                              {project.startDate && project.endDate
                                ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
                                : 'Datas não definidas'}
                            </span>
                          </div>
                          {project.budget && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {formatCurrency(project.budget)}
                                {project.spentAmount && parseFloat(project.spentAmount) > 0 && (
                                  <span className="ml-1">
                                    (gasto: {formatCurrency(project.spentAmount)})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Progress Sections */}
                        <div className="mt-3 space-y-2">
                          {/* Milestone Progress */}
                          {showMilestones && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                  Marcos ({project.milestones.filter((m: any) => m.completed).length}/{project.milestones.length})
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                  {milestoneProgress}%
                                </span>
                              </div>
                              <Progress value={milestoneProgress} className="h-2" />
                            </div>
                          )}
                          
                          {/* Budget Progress */}
                          {project.budget && parseFloat(project.spentAmount || 0) > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs sm:text-sm text-muted-foreground">Orçamento</span>
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                  {budgetProgress}%
                                </span>
                              </div>
                              <Progress value={budgetProgress} className="h-2" />
                            </div>
                          )}
                          
                          {/* Fallback progress for projects without detailed tracking */}
                          {!showMilestones && (!project.budget || parseFloat(project.spentAmount || 0) === 0) && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                  {dynamicStatus === 'completed' ? '100' : dynamicStatus === 'active' ? '50' : '10'}%
                                </span>
                              </div>
                              <Progress 
                                value={dynamicStatus === 'completed' ? 100 : dynamicStatus === 'active' ? 50 : 10} 
                                className="h-2" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {projects.length > 3 && (
              <div className="text-center pt-4">
                <Link href="/projects">
                  <Button variant="outline">Ver Todos os Projetos</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
