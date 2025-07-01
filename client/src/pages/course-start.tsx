import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
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
  GraduationCap,
  Calendar,
  BarChart3
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  courseType: string;
  coverImage: string | null;
  requirements: any;
  passScore: number;
  certificateEnabled: boolean;
  certificateTemplate?: string | null;
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
  correctAnswer?: string;
  explanation?: string;
}

interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  completedModules: string[];
  startedAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
}

interface Grade {
  id: string;
  userId: string;
  courseId: string;
  gradeScale: number;
  feedback?: string;
  passed: boolean;
  gradedAt: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  courseId: string;
  sessionDate: string;
  sessionTitle: string;
  attendanceStatus: 'present' | 'absent' | 'late';
}

export default function CourseStartPage() {
  const { courseId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, any>>>({});
  const [submissionResults, setSubmissionResults] = useState<Record<string, any>>({});

  // Função para converter minutos em horas
  const formatDurationInHours = (minutes: number): string => {
    const hours = Math.round(minutes / 60 * 10) / 10;
    return `${hours}h`;
  };

  // Get user data from auth context
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me')
  });

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

  // Get user grades for in-person courses
  const { data: userGrades } = useQuery<Grade[]>({
    queryKey: ['/api/courses', courseId, 'module-grades'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/module-grades`),
    enabled: !!courseId && course?.courseType === 'in_person'
  });

  // Get user attendance for in-person courses
  const { data: userAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/courses', courseId, 'attendance', 'records'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/attendance/records`),
    enabled: !!courseId && course?.courseType === 'in_person'
  });

  // Certificate related queries
  const { data: certificateEligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['/api/courses', courseId, 'certificate', 'eligibility'],
    enabled: !!courseId && !!authData?.user?.id && course?.certificateEnabled,
  });

  const { data: userCertificate, refetch: refetchCertificate } = useQuery({
    queryKey: ['/api/courses', courseId, 'certificate'],
    enabled: !!courseId && !!authData?.user?.id && course?.certificateEnabled,
  });

  const sortedModules = modules?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
  const currentModule = sortedModules[currentModuleIndex];

  // Get existing form submissions for current module
  const { data: existingSubmissions } = useQuery({
    queryKey: ['/api/modules', currentModule?.id, 'form-submission'],
    queryFn: () => apiRequest(`/api/modules/${currentModule?.id}/form-submission`),
    enabled: !!currentModule?.id
  });

  // Update submission results when data changes
  useEffect(() => {
    if (existingSubmissions && currentModule?.id) {
      setSubmissionResults(prev => ({ ...prev, [currentModule.id]: existingSubmissions }));
    }
  }, [existingSubmissions, currentModule?.id]);

  // Form submission mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: { moduleId: string; responses: Record<string, any> }) => {
      return apiRequest(`/api/modules/${data.moduleId}/form-submission`, 'POST', { responses: data.responses });
    }
  });

  // Certificate issuance mutation
  const issueCertificate = useMutation({
    mutationFn: () => apiRequest(`/api/courses/${courseId}/certificate/issue`, 'POST'),
    onSuccess: (data) => {
      toast({
        title: "Certificado Emitido!",
        description: "Parabéns! Seu certificado foi gerado com sucesso.",
      });
      
      refetchEligibility();
      refetchCertificate();
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'certificates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao emitir certificado",
        description: error.message || "Não foi possível gerar o certificado.",
        variant: "destructive",
      });
    }
  });

  // Handle form input changes
  const handleFormInputChange = (moduleId: string, fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [fieldId]: value
      }
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (moduleId: string, formFields: FormField[]) => {
    const moduleResponses = formResponses[moduleId] || {};
    
    // Validate required fields
    let hasErrors = false;
    for (const field of formFields) {
      if (field.required && !moduleResponses[field.id]) {
        toast({
          title: "Campo obrigatório",
          description: `O campo "${field.label}" é obrigatório.`,
          variant: "destructive",
        });
        hasErrors = true;
        break;
      }
    }

    if (!hasErrors) {
      try {
        const data = await submitFormMutation.mutateAsync({ moduleId, responses: moduleResponses });
        
        // Handle success
        setSubmissionResults(prev => ({ ...prev, [moduleId]: data }));
        
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId, 'form-submission'] });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/module-grades`] });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
        
        const percentage = data.percentage || 0;
        const status = data.passed ? "Aprovado" : "Reprovado";
        
        toast({
          title: `${status}! ${percentage}%`,
          description: `Você obteve ${data.score}/${data.maxScore} pontos (${data.correctAnswers}/${data.totalQuestions} respostas corretas).`,
        });
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: "Erro ao enviar formulário",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para renderizar blocos de conteúdo
  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <Card className="mb-4">
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

      case 'form':
        const moduleId = currentModule?.id || '';
        const moduleResponses = formResponses[moduleId] || {};
        const submissionResult = submissionResults[moduleId];
        
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissionResult ? (
                // Show results if form has been submitted
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Formulário Enviado com Sucesso!</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Pontuação:</span>
                        <span className="font-medium ml-2">{submissionResult.score}/{submissionResult.maxScore}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Percentual:</span>
                        <span className="font-medium ml-2">{submissionResult.percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Respostas Corretas:</span>
                        <span className="font-medium ml-2">{submissionResult.correctAnswers}/{submissionResult.totalQuestions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ml-2 ${submissionResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {submissionResult.passed ? 'Aprovado' : 'Reprovado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Show form if not submitted yet
                <form 
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (block.formFields && moduleId) {
                      handleFormSubmit(moduleId, block.formFields);
                    }
                  }}
                >
                  {block.formFields?.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          className="w-full p-2 border border-border rounded-md"
                          placeholder="Digite sua resposta..."
                          value={moduleResponses[field.id] || ''}
                          onChange={(e) => handleFormInputChange(moduleId, field.id, e.target.value)}
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          className="w-full p-2 border border-border rounded-md"
                          rows={4}
                          placeholder="Digite sua resposta..."
                          value={moduleResponses[field.id] || ''}
                          onChange={(e) => handleFormInputChange(moduleId, field.id, e.target.value)}
                        />
                      )}
                      
                      {field.type === 'radio' && field.options && (
                        <div className="space-y-2">
                          {field.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={field.id}
                                value={option}
                                checked={moduleResponses[field.id] === option}
                                onChange={(e) => handleFormInputChange(moduleId, field.id, e.target.value)}
                                className="text-primary"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'select' && field.options && (
                        <select 
                          className="w-full p-2 border border-border rounded-md"
                          value={moduleResponses[field.id] || ''}
                          onChange={(e) => handleFormInputChange(moduleId, field.id, e.target.value)}
                        >
                          <option value="">Selecione uma opção...</option>
                          {field.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'checkbox' && field.options && (
                        <div className="space-y-2">
                          {field.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={option}
                                checked={(moduleResponses[field.id] || []).includes(option)}
                                onChange={(e) => {
                                  const currentValues = moduleResponses[field.id] || [];
                                  let newValues;
                                  if (e.target.checked) {
                                    newValues = [...currentValues, option];
                                  } else {
                                    newValues = currentValues.filter((v: string) => v !== option);
                                  }
                                  handleFormInputChange(moduleId, field.id, newValues);
                                }}
                                className="text-primary"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={submitFormMutation.isPending}
                    >
                      {submitFormMutation.isPending ? 'Enviando...' : 'Enviar Respostas'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{block.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{block.content}</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando curso...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Curso não encontrado</h2>
            <p className="text-muted-foreground mb-4">O curso solicitado não existe ou foi removido.</p>
            <Button onClick={() => navigate('/courses')}>
              Voltar aos Cursos
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline">
                      {course.courseType === 'in_person' ? 'Presencial' : 'Online'}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                  <p className="text-lg text-muted-foreground">{course.description}</p>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDurationInHours(course.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{sortedModules.length} módulos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Certificado disponível</span>
                    </div>
                  </div>

                  {userProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso do Curso</span>
                        <span>{Math.round(userProgress.progress)}%</span>
                      </div>
                      <Progress value={userProgress.progress} className="h-2" />
                    </div>
                  )}
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

        {/* Show modules only for online courses */}
        {course.courseType !== 'in_person' && (
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
                                {formatDurationInHours(module.duration)}
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
                          <span className="text-sm">{formatDurationInHours(currentModule.duration)}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Module Content Blocks */}
                  <div className="space-y-4">
                    {currentModule.content?.blocks?.map((block) => (
                      <div key={block.id}>
                        {renderContentBlock(block)}
                      </div>
                    ))}
                  </div>
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
        )}

        {/* Certificate Section for All Course Types */}
        {course?.certificateEnabled && authData?.user && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificado do Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userCertificate ? (
                // Certificado já emitido - mostrar botão de download
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certificado Emitido
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Certificado emitido em {new Date(userCertificate.issuedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nº: {userCertificate.certificateNumber}
                    </p>
                  </div>
                  <Button 
                    onClick={() => window.open(`/api/courses/${courseId}/certificate/download`, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Certificado
                  </Button>
                </div>
              ) : certificateEligibility ? (
                // Verificar elegibilidade
                certificateEligibility.eligible ? (
                  // Elegível para emitir certificado
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-600 flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certificado Disponível!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Parabéns! Você completou todos os requisitos para receber o certificado.
                      </p>
                      {certificateEligibility.courseCompletion && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {course.courseType === 'online' ? (
                            <>
                              Nota: {certificateEligibility.courseCompletion.overallPercentage}% 
                              (mínimo: {certificateEligibility.courseCompletion.passScore}%)
                            </>
                          ) : (
                            <>
                              Nota: {certificateEligibility.courseCompletion.finalGrade} 
                              (Aprovado)
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => issueCertificate.mutate()}
                      disabled={issueCertificate.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {issueCertificate.isPending ? "Gerando..." : "Emitir Certificado"}
                      <Award className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  // Não elegível ainda
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-muted-foreground">
                        Certificado Indisponível
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {certificateEligibility.reason}
                      </p>
                      {certificateEligibility.courseCompletion && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {course.courseType === 'online' ? (
                            <>
                              Progresso: {certificateEligibility.courseCompletion.overallPercentage}% 
                              (mínimo: {certificateEligibility.courseCompletion.passScore}%)
                            </>
                          ) : (
                            'Aguardando avaliação final do instrutor'
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                // Carregando elegibilidade
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-muted-foreground">
                      Verificando Certificado...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Analisando seu progresso no curso.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Student Performance Section for In-Person Courses */}
        {course.courseType === 'in_person' && authData?.user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Grades Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Minhas Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userGrades && userGrades.length > 0 ? (
                  <div className="space-y-4">
                    {userGrades.map((grade, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">Nota Final do Curso</h4>
                            <p className="text-sm text-muted-foreground">
                              Avaliada pelo instrutor em {new Date(grade.gradedAt).toLocaleDateString('pt-BR')}
                            </p>
                            {grade.feedback && (
                              <p className="text-sm mt-2 text-gray-600">
                                <strong>Feedback:</strong> {grade.feedback}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {grade.gradeScale}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {grade.passed ? (
                                <span className="text-green-600 font-medium">Aprovado</span>
                              ) : (
                                <span className="text-red-600 font-medium">Reprovado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Ainda não há notas lançadas para você neste curso.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Minha Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userAttendance && userAttendance.length > 0 ? (
                  <div className="space-y-4">
                    {/* Attendance Records */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userAttendance.map((record) => (
                        <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-sm">{record.sessionTitle}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(record.sessionDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <Badge 
                            variant={
                              record.attendanceStatus === 'present' ? 'default' :
                              record.attendanceStatus === 'late' ? 'secondary' : 'destructive'
                            }
                          >
                            {record.attendanceStatus === 'present' ? 'Presente' :
                             record.attendanceStatus === 'late' ? 'Atrasado' : 'Ausente'}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Overall Statistics */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {userAttendance.filter(r => r.attendanceStatus === 'present').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Presenças</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-600">
                            {userAttendance.filter(r => r.attendanceStatus === 'late').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Atrasos</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">
                            {userAttendance.filter(r => r.attendanceStatus === 'absent').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Faltas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Ainda não há registros de frequência para você neste curso.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}