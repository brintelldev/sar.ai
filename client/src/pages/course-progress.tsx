import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Play, Clock, FileText, Download, CheckCircle2, Circle, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { formatDuration } from "@/lib/utils";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: number;
  orderIndex: number;
  content: {
    type: string;
    sections: Array<{
      type: string;
      title: string;
      videoUrl?: string;
      duration?: number;
      content?: string;
      instructions?: string;
    }>;
  };
  resources: Array<{
    type: string;
    title: string;
    url: string;
  }>;
  assessmentEnabled: boolean;
  completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  coverImage: string | null;
  learningObjectives: string[];
  tags: string[];
  passScore: number;
  certificateEnabled: boolean;
}

interface CourseProgress {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  completedModules: string[];
  startedAt: string;
  lastAccessedAt: string;
  timeSpent: number;
}

export default function CourseProgressPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<number>(0);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`)
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules`)
  });

  const { data: progress } = useQuery({
    queryKey: ['/api/courses/progress', courseId],
    queryFn: () => apiRequest(`/api/courses/progress/${courseId}`)
  });

  if (courseLoading || modulesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando curso...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
          <Link href="/courses">
            <Button>Voltar aos Cursos</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const modulesList = Array.isArray(modules) ? modules : [];
  const currentProgress = progress as CourseProgress;
  const completedModules = Array.isArray(currentProgress?.completedModules) ? currentProgress.completedModules : [];
  const progressPercentage = currentProgress?.progress || 0;

  const getModuleStatus = (moduleId: string) => {
    return completedModules.includes(moduleId) ? 'completed' : 'pending';
  };

  const getCurrentModule = () => {
    if (activeModule) {
      return modulesList.find(m => m.id === activeModule);
    }
    return modulesList.find(m => getModuleStatus(m.id) === 'pending') || modulesList[0];
  };

  const currentModule = getCurrentModule();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/courses">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Cursos
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {course.level}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(course.duration / 60)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Progresso</div>
                <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
              </div>
              <div className="w-20">
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Módulos */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Módulos do Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {modulesList?.map((module: CourseModule, index: number) => {
                  const status = getModuleStatus(module.id);
                  const isActive = currentModule?.id === module.id;
                  
                  return (
                    <div
                      key={module.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveModule(module.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            {status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm font-medium">
                              Módulo {index + 1}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {module.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {module.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(module.duration / 60)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Certificado */}
            {course.certificateEnabled && progressPercentage === 100 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <Award className="h-5 w-5 mr-2" />
                    Certificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Parabéns! Você concluiu o curso e pode baixar seu certificado.
                  </p>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Certificado
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {currentModule && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentModule.title}</CardTitle>
                  <CardDescription>{currentModule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="content">Conteúdo</TabsTrigger>
                      <TabsTrigger value="resources">Recursos</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-6">
                      {currentModule.content?.blocks?.map((section: any, index: number) => (
                        <div key={index} className="space-y-4">
                          {section.title && <h3 className="text-lg font-semibold">{section.title}</h3>}
                          
                          {section.type === 'video' && section.content && (
                            <div className="aspect-video">
                              <iframe
                                src={section.content}
                                title={section.title}
                                className="w-full h-full rounded-lg"
                                allowFullScreen
                              />
                              {section.duration && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  Duração: {formatDuration(section.duration / 60)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {section.type === 'text' && section.content && (
                            <div className="prose max-w-none">
                              <div className="bg-gray-50 p-6 rounded-lg">
                                <div 
                                  className="text-gray-800 whitespace-pre-line"
                                  dangerouslySetInnerHTML={{
                                    __html: section.content
                                      .replace(/# /g, '<h1 class="text-2xl font-bold mb-4">')
                                      .replace(/## /g, '<h2 class="text-xl font-semibold mb-3">')
                                      .replace(/### /g, '<h3 class="text-lg font-medium mb-2">')
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                      .replace(/- /g, '<li>')
                                      .replace(/\n\n/g, '</p><p class="mb-4">')
                                      .replace(/^\s*/, '<p class="mb-4">')
                                      + '</p>'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {section.type === 'practical' && section.instructions && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Exercício Prático</h4>
                              <p className="text-blue-800">{section.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex justify-between pt-6">
                        <Button variant="outline" disabled>
                          Módulo Anterior
                        </Button>
                        <Button>
                          Próximo Módulo
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="resources" className="space-y-4">
                      <h3 className="text-lg font-semibold">Recursos Complementares</h3>
                      
                      {currentModule.resources?.map((resource: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                  {resource.type === 'pdf' && <FileText className="h-5 w-5 text-blue-600" />}
                                  {resource.type === 'link' && <FileText className="h-5 w-5 text-blue-600" />}
                                  {resource.type === 'template' && <Download className="h-5 w-5 text-blue-600" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{resource.title}</h4>
                                  <p className="text-sm text-gray-600 capitalize">{resource.type}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {currentModule.resources.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhum recurso disponível para este módulo</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}