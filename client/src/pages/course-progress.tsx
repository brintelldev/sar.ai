import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Award,
  ArrowLeft,
  FileText,
  Video,
  Link as LinkIcon,
  Download
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  status: string;
  learningObjectives?: string[];
  certificateEnabled: boolean;
}

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: any;
  orderIndex: number;
  estimatedDuration: number;
  isRequired: boolean;
}

interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  completedModules: string[];
  currentModuleId?: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  lastAccessedAt: string;
  certificateGenerated: boolean;
}

export default function CourseProgress() {
  const [, params] = useRoute("/courses/:id/progress");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const courseId = params?.id;

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules`),
    enabled: !!courseId
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'user-progress'],
    queryFn: () => {
      // Use localStorage temporarily for progress tracking
      const saved = localStorage.getItem(`course_progress_${courseId}`);
      return saved ? JSON.parse(saved) : {
        progress: 0,
        completedModules: [],
        status: 'not_started',
        timeSpent: 0,
        certificateGenerated: false
      };
    },
    enabled: !!courseId
  });

  const completeModuleMutation = useMutation({
    mutationFn: (moduleId: string) => {
      // Update localStorage temporarily
      const currentProgress = userProgress || { 
        progress: 0, 
        completedModules: [], 
        status: 'not_started',
        timeSpent: 0,
        certificateGenerated: false 
      };
      
      const newCompletedModules = [...currentProgress.completedModules];
      if (!newCompletedModules.includes(moduleId)) {
        newCompletedModules.push(moduleId);
      }
      
      const totalModules = sortedModules.length;
      const newProgress = totalModules > 0 ? (newCompletedModules.length / totalModules) * 100 : 0;
      const isCompleted = newProgress >= 100;
      
      const updatedProgress = {
        ...currentProgress,
        completedModules: newCompletedModules,
        progress: Math.round(newProgress),
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date().toISOString() : currentProgress.completedAt,
        lastAccessedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`course_progress_${courseId}`, JSON.stringify(updatedProgress));
      return Promise.resolve(updatedProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'user-progress'] });
      toast({
        title: "Módulo concluído",
        description: "Seu progresso foi atualizado com sucesso."
      });
    }
  });

  const generateCertificateMutation = useMutation({
    mutationFn: () => {
      // Generate certificate using localStorage temporarily
      const currentProgress = userProgress || { certificateGenerated: false };
      const updatedProgress = {
        ...currentProgress,
        certificateGenerated: true,
        certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        certificateIssuedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`course_progress_${courseId}`, JSON.stringify(updatedProgress));
      return Promise.resolve(updatedProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'user-progress'] });
      toast({
        title: "Certificado gerado",
        description: "Seu certificado está disponível para download."
      });
    }
  });

  if (courseLoading || modulesLoading || progressLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Curso não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedModules = modules?.sort((a: CourseModule, b: CourseModule) => a.orderIndex - b.orderIndex) || [];
  const progress = userProgress || { 
    progress: 0, 
    completedModules: [], 
    status: 'not_started',
    timeSpent: 0,
    certificateGenerated: false 
  };

  const completedCount = progress.completedModules?.length || 0;
  const totalModules = sortedModules.length;
  const progressPercentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  const isCompleted = progressPercentage === 100;
  const canGenerateCertificate = isCompleted && course.certificateEnabled && !progress.certificateGenerated;

  const getContentTypeIcon = (content: any) => {
    if (!content || !content.blocks) return <FileText className="h-4 w-4" />;
    
    const hasVideo = content.blocks.some((block: any) => block.type === 'video');
    const hasFile = content.blocks.some((block: any) => block.type === 'file');
    const hasLink = content.blocks.some((block: any) => block.type === 'link');
    
    if (hasVideo) return <Video className="h-4 w-4" />;
    if (hasFile) return <Download className="h-4 w-4" />;
    if (hasLink) return <LinkIcon className="h-4 w-4" />;
    
    return <FileText className="h-4 w-4" />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/courses')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Cursos
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalModules} módulos</span>
                </div>
                <Badge variant="outline">{course.level}</Badge>
              </div>
            </div>
            {canGenerateCertificate && (
              <Button 
                onClick={() => generateCertificateMutation.mutate()}
                disabled={generateCertificateMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Award className="h-4 w-4" />
                <span>Gerar Certificado</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso do Curso</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} de {totalModules} módulos concluídos
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{Math.round(progressPercentage)}% completo</span>
                {progress.timeSpent > 0 && (
                  <span>Tempo estudado: {formatDuration(progress.timeSpent)}</span>
                )}
              </div>
            </div>

            {isCompleted && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-300">
                    Parabéns! Você concluiu o curso com sucesso!
                  </span>
                </div>
                {course.certificateEnabled && (
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    {progress.certificateGenerated 
                      ? "Seu certificado está disponível para download."
                      : "Gere seu certificado de conclusão clicando no botão acima."
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos do Curso</CardTitle>
          <CardDescription>
            Complete todos os módulos para finalizar o curso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedModules.map((module: CourseModule, index: number) => {
              const isCompleted = progress.completedModules?.includes(module.id);
              const isCurrent = progress.currentModuleId === module.id;
              const isPrevious = index < completedCount;
              const canAccess = index === 0 || isPrevious || isCompleted;

              return (
                <div key={module.id} className="space-y-3">
                  <div className={`
                    p-4 rounded-lg border transition-colors
                    ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                    ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
                    ${!canAccess ? 'bg-gray-50 dark:bg-gray-900/20 opacity-60' : ''}
                  `}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : isCurrent ? (
                            <PlayCircle className="h-6 w-6 text-blue-600" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getContentTypeIcon(module.content)}
                            <h4 className="font-medium">{module.title}</h4>
                            {module.isRequired && (
                              <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>⏱️ {formatDuration(module.estimatedDuration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canAccess && !isCompleted && (
                          <Button
                            size="sm"
                            onClick={() => completeModuleMutation.mutate(module.id)}
                            disabled={completeModuleMutation.isPending}
                          >
                            Marcar como Concluído
                          </Button>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < sortedModules.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}