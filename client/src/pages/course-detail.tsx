import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Award, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  content: any;
  videoUrl?: string;
  materials: any[];
  duration: number;
  isRequired: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  coverImage?: string;
  requirements: string[];
  learningObjectives: string[];
  passScore: number;
  certificateEnabled: boolean;
  modules?: CourseModule[];
}

interface UserProgress {
  id: string;
  status: string;
  progress: number;
  completedModules: string[];
  startedAt?: string;
  completedAt?: string;
  timeSpent: number;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [currentModule, setCurrentModule] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', id],
    queryFn: () => apiRequest(`/api/courses/${id}`),
    enabled: !!id,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/courses', id, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${id}/modules`),
    enabled: !!id,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['/api/courses', id, 'progress'],
    queryFn: () => apiRequest(`/api/courses/${id}/progress`),
    enabled: !!id,
  });

  const startCourseMutation = useMutation({
    mutationFn: () => apiRequest(`/api/courses/${id}/start`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', id, 'progress'] });
      toast({
        title: "Sucesso",
        description: "Curso iniciado com sucesso!",
      });
    },
  });

  const completeModuleMutation = useMutation({
    mutationFn: (moduleId: string) => apiRequest(`/api/courses/${id}/modules/${moduleId}/complete`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', id, 'progress'] });
      toast({
        title: "Módulo concluído",
        description: "Parabéns! Você concluiu este módulo.",
      });
    },
  });

  const isModuleCompleted = (moduleId: string) => {
    return userProgress?.completedModules?.includes(moduleId) || false;
  };

  const isModuleAccessible = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    const previousModule = modules[moduleIndex - 1];
    return isModuleCompleted(previousModule?.id);
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const renderModuleContent = (module: CourseModule) => {
    return (
      <div className="space-y-6">
        {/* Video */}
        {module.videoUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={getVideoEmbedUrl(module.videoUrl)}
              className="w-full h-full"
              allowFullScreen
              title={module.title}
            />
          </div>
        )}

        {/* Content */}
        {module.content && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: module.content.html || module.content }} />
          </div>
        )}

        {/* Materials */}
        {module.materials && module.materials.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Materiais de Apoio</h3>
            <div className="grid gap-3">
              {module.materials.map((material: any, index: number) => (
                <Card key={index}>
                  <CardContent className="flex items-center p-4">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-gray-600">{material.type}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={material.url} target="_blank" rel="noopener noreferrer">
                        Baixar
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Complete Module Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={() => completeModuleMutation.mutate(module.id)}
            disabled={isModuleCompleted(module.id) || completeModuleMutation.isPending}
            size="lg"
            className={isModuleCompleted(module.id) ? "bg-green-600" : ""}
          >
            {isModuleCompleted(module.id) ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Módulo Concluído
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                {completeModuleMutation.isPending ? 'Marcando...' : 'Marcar como Concluído'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando curso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h2>
          <Button onClick={() => setLocation('/courses')}>
            Voltar aos Cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/courses')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-2">{course.description}</p>
        </div>
      </div>

      {/* Course Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs value={currentModule || modules[0]?.id} onValueChange={setCurrentModule}>
            {/* Module Navigation */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Módulos do Curso</h2>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 h-auto bg-transparent">
                {modules.map((module: CourseModule, index: number) => (
                  <TabsTrigger
                    key={module.id}
                    value={module.id}
                    disabled={!isModuleAccessible(index)}
                    className="flex items-center justify-start p-4 h-auto data-[state=active]:bg-blue-50 data-[state=active]:border-blue-200"
                  >
                    <div className="flex items-center mr-3">
                      {isModuleCompleted(module.id) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isModuleAccessible(index) ? (
                        <Play className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{module.title}</p>
                      <p className="text-sm text-gray-600">{module.duration}min</p>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Module Content */}
            {modules.map((module: CourseModule) => (
              <TabsContent key={module.id} value={module.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="h-5 w-5 mr-2" />
                      {module.title}
                    </CardTitle>
                    {module.description && (
                      <CardDescription>{module.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderModuleContent(module)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          {userProgress ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seu Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progresso</span>
                      <span>{userProgress.progress}%</span>
                    </div>
                    <Progress value={userProgress.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Módulos</p>
                      <p className="font-medium">
                        {userProgress.completedModules?.length || 0}/{modules.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tempo gasto</p>
                      <p className="font-medium">{Math.round(userProgress.timeSpent / 60)}h</p>
                    </div>
                  </div>

                  {userProgress.status === 'completed' && (
                    <Badge className="w-full justify-center bg-green-100 text-green-800">
                      <Award className="h-4 w-4 mr-2" />
                      Curso Concluído
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Iniciar Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => startCourseMutation.mutate()}
                  disabled={startCourseMutation.isPending}
                  className="w-full"
                >
                  {startCourseMutation.isPending ? 'Iniciando...' : 'Começar Agora'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <Badge variant="outline" className="capitalize">{course.category}</Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Nível</p>
                <Badge variant="outline" className="capitalize">{course.level}</Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Duração total</p>
                <p className="font-medium">{course.duration}h</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Módulos</p>
                <p className="font-medium">{modules.length}</p>
              </div>

              {course.certificateEnabled && (
                <div>
                  <p className="text-sm text-gray-600">Certificado</p>
                  <p className="font-medium text-green-600">Disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objetivos de Aprendizagem</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}