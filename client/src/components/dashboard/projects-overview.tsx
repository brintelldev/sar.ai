import { Plus, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects } from '@/hooks/use-organization';
import { Link } from 'wouter';

export function ProjectsOverview() {
  const { data: projects, isLoading } = useProjects();

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
      default:
        return status;
    }
  };

  const calculateProgress = (project: any) => {
    if (!project.budget || !project.spentAmount) return 0;
    return Math.round((parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Projetos em Andamento</h2>
          <Link href="/projects">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </Link>
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
            {projects.slice(0, 3).map((project: any) => (
              <div
                key={project.id}
                className="border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {project.startDate && project.endDate
                            ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
                            : 'Datas não definidas'}
                        </span>
                      </div>
                      {project.budget && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(project.budget)}
                          </span>
                        </div>
                      )}
                    </div>
                    {project.budget && (
                      <div className="mt-3">
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
                  <div className="ml-4">
                    <Badge className={`status-badge ${getStatusVariant(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
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
