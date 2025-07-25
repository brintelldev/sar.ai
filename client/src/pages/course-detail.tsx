import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MainLayout } from "@/components/layout/main-layout";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { 
  Clock, 
  BookOpen, 
  Users, 
  Award, 
  PlayCircle, 
  CheckCircle, 
  Target,
  Calendar,
  Star,

  Share2,
  User
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  coverImage: string | null;
  status: string;
  requirements: string | null;
  learningObjectives: string[] | string | null;
  tags: string[] | null;
  passScore: number;
  certificateEnabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  enrolledCount: number;
  completionRate: number;
}

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  orderIndex: number;
  duration: number | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  completedModules: string[];
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
  timeSpent: number;
}

interface ModuleGrade {
  moduleId: string;
  moduleTitle: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

export default function CourseDetailPage() {
  const { id: courseId } = useParams();
  const [, navigate] = useLocation();
  const { user, userRole } = useAuth();

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId
  });

  // Fetch course modules
  const { data: modules, isLoading: modulesLoading } = useQuery<CourseModule[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
    enabled: !!courseId
  });

  // Fetch user progress
  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: [`/api/courses/${courseId}/progress`],
    enabled: !!courseId
  });

  // Fetch user module grades
  const { data: moduleGrades } = useQuery<ModuleGrade[]>({
    queryKey: [`/api/courses/${courseId}/module-grades`],
    enabled: !!courseId
  });

  if (courseLoading || modulesLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
            <Button onClick={() => navigate('/courses')}>
              Voltar aos Cursos
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleStartCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/start`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        navigate(`/courses/${courseId}/start`);
      }
    } catch (error) {
      console.error('Error starting course:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'tecnologia': 'bg-blue-100 text-blue-800',
      'gestão': 'bg-green-100 text-green-800',
      'empreendedorismo': 'bg-purple-100 text-purple-800',
      'comunicação': 'bg-orange-100 text-orange-800',
      'desenvolvimento': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'iniciante': 'bg-green-100 text-green-800',
      'intermediário': 'bg-yellow-100 text-yellow-800',
      'avançado': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isStarted = userProgress?.status !== 'not_started' && userProgress?.status;
  const isCompleted = userProgress?.status === 'completed';

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getCategoryColor(course.category)}>
                    {course.category}
                  </Badge>
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                  {course.certificateEnabled && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Award className="w-3 h-3 mr-1" />
                      Certificado
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold leading-tight">
                  {course.title}
                </h1>
                
                <p className="text-xl text-blue-100 leading-relaxed">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{modules?.length || 0} módulos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{course.enrolledCount} inscritos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>{course.completionRate}% de conclusão</span>
                  </div>
                </div>

                {/* Progress Bar (if started) */}
                {isStarted && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Seu Progresso</span>
                      <span className="text-sm">{userProgress.progress}%</span>
                    </div>
                    <Progress value={userProgress.progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Action Card */}
              <div className="lg:col-span-1">
                <Card className="bg-white shadow-xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Course Image Placeholder */}
                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-blue-600" />
                      </div>

                      {/* Action Button */}
                      <div className="space-y-2">
                        {!isStarted ? (
                          <Button 
                            onClick={handleStartCourse}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Iniciar Curso
                          </Button>
                        ) : isCompleted ? (
                          <Button 
                            onClick={() => navigate(`/courses/${courseId}/start`)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Curso Concluído
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => navigate(`/courses/${courseId}/start`)}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            size="lg"
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Continuar Curso
                          </Button>
                        )}

                        {/* Botões administrativos - apenas para admins e managers */}
                        {userRole !== 'beneficiary' && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => navigate(`/courses/${courseId}/manage`)}
                            >
                              <User className="w-4 h-4 mr-1" />
                              Gerenciar
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Course Info */}
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Duração:</span>
                          <span className="font-medium text-foreground">{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Módulos:</span>
                          <span className="font-medium text-foreground">{modules?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Nota Mínima:</span>
                          <span className="font-medium text-foreground">{course.passScore}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Certificado:</span>
                          <span className="font-medium text-foreground">
                            {course.certificateEnabled ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>

                      {/* Module Grades Section */}
                      {moduleGrades && moduleGrades.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="font-medium text-foreground flex items-center">
                              <Award className="w-4 h-4 mr-2 text-yellow-600" />
                              Notas por Módulo
                            </h4>
                            <div className="space-y-2">
                              {moduleGrades.map((grade, index) => (
                                <div 
                                  key={grade.moduleId} 
                                  className="flex items-center justify-between py-1 px-2 bg-muted/30 dark:bg-muted/10 rounded text-xs"
                                >
                                  <span className="text-foreground truncate flex-1 mr-2">
                                    {index + 1}. {grade.moduleTitle}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    {grade.percentage !== null ? (
                                      <>
                                        <span className={`font-medium ${
                                          grade.passed 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                        }`}>
                                          {grade.percentage}%
                                        </span>
                                        {grade.passed ? (
                                          <CheckCircle className="w-3 h-3 text-green-600" />
                                        ) : (
                                          <span className="w-3 h-3 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">×</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-500 font-medium">
                                        N/A
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Learning Objectives */}
              {course.learningObjectives && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-green-600" />
                      <span>Objetivos de Aprendizagem</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {(() => {
                        // Handle both string and array formats
                        let objectives: string[] = [];
                        
                        if (typeof course.learningObjectives === 'string') {
                          // Split by newlines if it's a string
                          objectives = course.learningObjectives.split('\n').filter(obj => obj.trim());
                        } else if (Array.isArray(course.learningObjectives)) {
                          objectives = course.learningObjectives;
                        } else if (course.learningObjectives) {
                          objectives = [String(course.learningObjectives)];
                        }
                        
                        return objectives.map((objective: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{objective}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Conteúdo do Curso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modules?.map((module, index) => (
                      <div 
                        key={module.id} 
                        className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/courses/${courseId}/start`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{module.title}</h3>
                              {module.description && (
                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            {module.duration && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(module.duration)}</span>
                              </span>
                            )}
                            {userProgress?.completedModules?.includes(module.id) && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            <PlayCircle className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {course.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-orange-600" />
                      <span>Pré-requisitos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-foreground">
                      {course.requirements}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Info */}

            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}