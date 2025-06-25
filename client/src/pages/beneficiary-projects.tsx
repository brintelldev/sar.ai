import { useState } from 'react';
import { Search, Calendar, Users, Target, Eye, CheckSquare } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProjects } from '@/hooks/use-organization';
import { useSimpleAuth as useAuth } from '@/hooks/use-simple-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function BeneficiaryProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { data: projects = [], isLoading } = useProjects();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter only active projects for beneficiaries
  const activeProjects = projects.filter(project => 
    project.status === 'active' && 
    (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleVolunteerInterest = async (projectId: string) => {
    try {
      await apiRequest(`/api/projects/${projectId}/volunteer-interest`, 'POST', {
        userId: user?.id,
        message: 'Tenho interesse em participar como voluntária neste projeto.'
      });
      
      toast({
        title: "Interesse registrado",
        description: "Seu interesse foi enviado para a coordenação do projeto.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu interesse. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'planning':
        return { label: 'Planejamento', color: 'bg-yellow-100 text-yellow-800' };
      case 'active':
        return { label: 'Em Andamento', color: 'bg-green-100 text-green-800' };
      case 'paused':
        return { label: 'Pausado', color: 'bg-gray-100 text-gray-800' };
      case 'completed':
        return { label: 'Concluído', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: 'Planejamento', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projetos</h1>
          <p className="text-gray-600">
            Conheça os projetos em andamento e manifeste seu interesse em participar
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {activeProjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto ativo'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar os termos da busca.' 
                  : 'Novos projetos estarão disponíveis em breve.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => {
              const statusInfo = getStatusInfo(project.status);
              let milestones = [];
              try {
                milestones = typeof project.milestones === 'string' 
                  ? JSON.parse(project.milestones) 
                  : project.milestones || [];
              } catch {
                milestones = [];
              }

              const completedMilestones = milestones.filter((m: any) => m.completed).length;
              const totalMilestones = milestones.length;
              const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {project.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {project.startDate ? formatDate(project.startDate) : 'A definir'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {formatCurrency(project.budget || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    {totalMilestones > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progresso</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {completedMilestones} de {totalMilestones} marcos concluídos
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{project.name}</DialogTitle>
                            <DialogDescription>
                              Informações detalhadas do projeto
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Descrição</h4>
                              <p className="text-gray-600">{project.description}</p>
                            </div>
                            
                            {milestones.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Marcos do Projeto</h4>
                                <div className="space-y-2">
                                  {milestones.map((milestone: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <CheckSquare className={`h-4 w-4 ${milestone.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                      <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                                        {milestone.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div>
                                <p className="text-sm text-gray-500">Data de Início</p>
                                <p className="font-medium">
                                  {project.startDate ? formatDate(project.startDate) : 'A definir'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Orçamento</p>
                                <p className="font-medium">{formatCurrency(project.budget || 0)}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleVolunteerInterest(project.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Participar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}