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
      {/* CardContent oculto */}
    </Card>
  );
}
