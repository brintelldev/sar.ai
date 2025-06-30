import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Circle,
  Play,
  FileText,
  Image,
  Video,
  Download,
  ExternalLink,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  content: {
    blocks: ContentBlock[];
  };
  videoUrl: string | null;
  materials: any;
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
  status: string;
  coverImage: string | null;
  requirements: any;
  passScore: number;
  certificateEnabled: boolean;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'form' | 'embed';
  title: string;
  content: string;
  url?: string;
  embedCode?: string;
  formFields?: FormField[];
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface UserProgress {
  courseId: string;
  progress: number;
  status: string;
  completedModules: string[];
  startedAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
}

export default function CourseStartPage() {
  const { courseId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);

  // Get course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Get course modules
  const { data: modules, isLoading: modulesLoading } = useQuery<CourseModule[]>({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules`),
    enabled: !!courseId
  });

  // Get user progress
  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/progress`),
    enabled: !!courseId
  });

  const currentModule = modules?.[currentModuleIndex];
  const sortedModules = modules?.sort((a, b) => a.orderIndex - b.orderIndex) || [];

  useEffect(() => {
    if (userProgress?.completedModules) {
      setCompletedModules(Array.isArray(userProgress.completedModules) ? userProgress.completedModules : []);
    }
  }, [userProgress]);

  const markModuleComplete = useMutation({
    mutationFn: (moduleId: string) => 
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}/complete`, 'POST'),
    onSuccess: () => {
      if (currentModule) {
        setCompletedModules(prev => [...prev, currentModule.id]);
        toast({
          title: "Módulo Concluído",
          description: "Parabéns! Você completou este módulo.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
      }
    }
  });

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {block.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'image':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={block.url} 
                alt={block.title}
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
              {block.content && (
                <p className="mt-2 text-sm text-muted-foreground">{block.content}</p>
              )}
            </CardContent>
          </Card>
        );

      case 'video':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video">
                <iframe
                  src={block.url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={block.title}
                />
              </div>
              {block.content && (
                <p className="mt-2 text-sm text-muted-foreground">{block.content}</p>
              )}
            </CardContent>
          </Card>
        );

      case 'pdf':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{block.content}</p>
              <Button asChild>
                <a href={block.url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        );

      case 'embed':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {block.content && <p className="mb-4">{block.content}</p>}
              <div 
                className="w-full"
                dangerouslySetInnerHTML={{ __html: block.embedCode || '' }}
              />
            </CardContent>
          </Card>
        );

      case 'form':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {block.title || 'Exercício'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {block.content && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <div className="prose dark:prose-invert max-w-none">
                    {block.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {block.formFields && block.formFields.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    <strong>Instruções:</strong> Este é um exercício interativo. Responda todas as questões e clique em "Acessar Exercício" para ir para a página de envio completa.
                  </div>
                  
                  {/* Preview das questões */}
                  <div className="space-y-4">
                    {block.formFields.slice(0, 3).map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">
                            <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                              {index + 1}
                            </span>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.points && (
                            <Badge variant="secondary" className="text-xs">
                              {field.points} pts
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          Tipo: {field.type === 'text' ? 'Texto Curto' : 
                                field.type === 'textarea' ? 'Texto Longo' : 
                                field.type === 'radio' ? 'Múltipla Escolha' : 
                                field.type === 'select' ? 'Seleção' : 'Checkbox'}
                        </div>
                        
                        {field.type === 'radio' && field.options && (
                          <div className="text-sm text-muted-foreground">
                            Opções: {field.options.join(', ')}
                          </div>
                        )}
                        
                        {field.type === 'select' && field.options && (
                          <div className="text-sm text-muted-foreground">
                            {field.options.length} opções disponíveis
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {block.formFields.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                        + {block.formFields.length - 3} questões adicionais
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      <strong>{block.formFields.length}</strong> questões • 
                      <strong> {block.formFields.reduce((total, field) => total + (field.points || 0), 0)}</strong> pontos totais
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/courses/${courseId}/modules/${currentModule.id}/form`)}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Acessar Exercício
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Este exercício ainda não possui questões configuradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando curso...</div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
          <Button onClick={() => navigate('/courses')}>
            Voltar aos Cursos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const progressPercentage = sortedModules.length > 0 
    ? (completedModules.length / sortedModules.length) * 100 
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cursos
          </Button>
        </div>

        {/* Course Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {sortedModules.length} módulos
                  </div>
                  {course.certificateEnabled && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Certificado
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Curso</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
              
              {course.coverImage && (
                <img 
                  src={course.coverImage} 
                  alt={course.title}
                  className="w-32 h-24 object-cover rounded-lg ml-6"
                />
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Module Navigation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Módulos do Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {sortedModules.map((module, index) => {
                    const isCompleted = completedModules.includes(module.id);
                    const isActive = index === currentModuleIndex;
                    
                    return (
                      <div
                        key={module.id}
                        onClick={() => {
                          setCurrentModuleIndex(index);
                          setShowContent(true);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {module.title}
                            </div>
                            <div className="text-xs opacity-75 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {module.duration} min
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Module Content */}
          <div className="lg:col-span-3">
            {!showContent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Play className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Pronto para Começar?</h3>
                  <p className="text-muted-foreground mb-6">
                    Selecione um módulo na barra lateral para começar seu aprendizado
                  </p>
                  <Button 
                    onClick={() => {
                      setCurrentModuleIndex(0);
                      setShowContent(true);
                    }}
                    disabled={sortedModules.length === 0}
                  >
                    Começar Primeiro Módulo
                  </Button>
                </CardContent>
              </Card>
            ) : currentModule ? (
              <div className="space-y-6">
                {/* Module Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline">Módulo {currentModule.orderIndex}</Badge>
                          {currentModule.title}
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">{currentModule.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{currentModule.duration} min</span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Module Content */}
                <div className="space-y-4">
                  {currentModule.content?.blocks?.map(renderContentBlock)}
                </div>

                {/* Module Navigation */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                        disabled={currentModuleIndex === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Módulo Anterior
                      </Button>

                      <div className="flex gap-2">
                        {!completedModules.includes(currentModule.id) && (
                          <Button
                            onClick={() => markModuleComplete.mutate(currentModule.id)}
                            disabled={markModuleComplete.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Concluído
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={() => setShowContent(false)}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Voltar ao Início
                        </Button>
                      </div>

                      <Button
                        onClick={() => setCurrentModuleIndex(Math.min(sortedModules.length - 1, currentModuleIndex + 1))}
                        disabled={currentModuleIndex >= sortedModules.length - 1}
                      >
                        Próximo Módulo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum Módulo Encontrado</h3>
                  <p className="text-muted-foreground">
                    Este curso ainda não possui módulos criados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}