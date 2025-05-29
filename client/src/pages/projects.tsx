import { useState } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects } from '@/hooks/use-organization';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProjects = projects?.filter((project: any) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
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
                <Button>
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
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
