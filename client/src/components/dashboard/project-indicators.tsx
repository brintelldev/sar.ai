import { FolderKanban, Target, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useProjectIndicators } from '@/hooks/use-organization';

export function ProjectIndicators() {
  const { data: indicators, isLoading } = useProjectIndicators();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indicadores de Projetos
          </CardTitle>
          <CardDescription>
            Acompanhe o status e progresso dos seus projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indicadores de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Erro ao carregar indicadores dos projetos
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planejamento';
      case 'active':
        return 'Em Andamento';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Indicadores de Projetos
        </CardTitle>
        <CardDescription>
          Acompanhe o status e progresso dos seus projetos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FolderKanban className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Planejamento</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {indicators.projectsInPlanning}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Em Andamento</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {indicators.projectsInProgress}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Detalhamento dos Projetos
          </h4>
          
          {indicators.projectDetails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum projeto encontrado</p>
              <p className="text-sm">Crie seu primeiro projeto para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {indicators.projectDetails.map((project) => (
                <div 
                  key={project.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium">{project.name}</h5>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {getStatusText(project.status)}
                      </Badge>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Progresso</div>
                      <div className="font-semibold">{project.progress}%</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={project.progress} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Orçamento: </span>
                        <span className="font-medium">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gasto: </span>
                        <span className={`font-medium ${
                          project.spent > project.budget 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(project.spent)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}