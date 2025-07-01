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
  Users,
  GraduationCap,
  Calendar,
  Star,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateCertificatePDF, CertificateData } from "@/lib/pdf-generator";

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

  // Função para converter minutos em horas
  const formatDurationInHours = (minutes: number): string => {
    const hours = Math.round(minutes / 60 * 10) / 10; // Arredonda para 1 casa decimal
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

  // Get certificate eligibility
  const { data: certificateEligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['/api/courses', courseId, 'certificate', 'eligibility'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/certificate/eligibility`),
    enabled: !!courseId
  });

  // Get user's existing certificate for this course
  const { data: userCertificate, refetch: refetchCertificate } = useQuery({
    queryKey: ['/api/courses', courseId, 'certificate'],
    queryFn: async () => {
      try {
        // Esta chamada pode falhar se não houver certificado, então tratamos como opcional
        const response = await fetch(`/api/courses/${courseId}/certificate`);
        if (response.ok) {
          return response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!courseId
  });

  // Get user's grades for in-person courses
  const { data: userGrades } = useQuery<Grade[]>({
    queryKey: ['/api/courses', courseId, 'module-grades'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/module-grades`),
    enabled: !!courseId && !!authData?.user?.id && course?.courseType === 'in_person'
  });

  // Get user's attendance for in-person courses  
  const { data: userAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/courses', courseId, 'attendance', 'records'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/attendance/records`),
    enabled: !!courseId && !!authData?.user?.id && course?.courseType === 'in_person'
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
        // Verificar elegibilidade do certificado após completar módulo
        refetchEligibility();
      }
    }
  });

  // Função para gerar PDF do certificado
  const generateCertificatePDFFromData = (certificate: any, courseData: any) => {
    const userData = authData?.user;
    const orgData = authData?.currentOrganization;
    
    console.log('🎓 Gerando certificado com template personalizado:', {
      courseTemplate: courseData?.certificateTemplate,
      hasTemplate: !!(courseData?.certificateTemplate && courseData?.certificateTemplate.trim())
    });
    
    // Para cursos presenciais, usar dados da metadata do certificado
    const isPresentialCourse = courseData?.courseType === 'in_person' || courseData?.courseType === 'presencial';
    const finalGrade = certificate.metadata?.courseCompletion?.finalGrade;
    const courseCompletion = certificate.metadata?.courseCompletion;
    
    const certificateData: CertificateData = {
      userName: userData?.name || 'Usuário',
      courseName: courseData?.title || 'Curso',
      courseCategory: courseData?.category || 'Geral',
      completionDate: new Date(certificate.issuedAt).toLocaleDateString('pt-BR'),
      certificateNumber: certificate.certificateNumber,
      organizationName: orgData?.name || 'Organização',
      courseHours: Math.round((courseData?.duration || 0) / 60), // Converter minutos para horas
      // Para cursos presenciais, usar nota final; para online, usar porcentagem
      overallScore: isPresentialCourse ? finalGrade : certificate.metadata?.courseCompletion?.overallPercentage,
      passScore: isPresentialCourse ? 7.0 : certificate.metadata?.courseCompletion?.passScore,
      verificationCode: certificate.verificationCode,
      customTemplate: courseData?.certificateTemplate, // Template personalizado do curso
      studentCpf: userData?.cpf || userData?.document,
      startDate: userProgress?.startedAt ? new Date(userProgress.startedAt).toLocaleDateString('pt-BR') : undefined,
      instructorName: 'Equipe de Capacitação',
      instructorTitle: 'Instrutor(a)',
      city: 'São Paulo',
      issueDate: new Date().toLocaleDateString('pt-BR'),
      // Informações específicas para cursos presenciais
      finalGrade: isPresentialCourse ? finalGrade : undefined,
      courseType: courseData?.courseType,
      instructorFeedback: courseCompletion?.feedback
    };

    generateCertificatePDF(certificateData);
  };

  // Emitir certificado
  const issueCertificate = useMutation({
    mutationFn: () => apiRequest(`/api/courses/${courseId}/certificate/issue`, 'POST'),
    onSuccess: (data) => {
      toast({
        title: "Certificado Emitido!",
        description: "Parabéns! Seu certificado foi gerado com sucesso.",
      });
      
      // Gerar automaticamente o PDF do certificado
      if (data.certificate && course) {
        generateCertificatePDFFromData(data.certificate, course);
      }
      
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

  // Baixar certificado existente
  const downloadCertificate = () => {
    console.log('Download certificate clicked!', { userCertificate, course });
    
    if (!userCertificate) {
      toast({
        title: "Erro",
        description: "Certificado não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    if (!course) {
      toast({
        title: "Erro",
        description: "Dados do curso não encontrados.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      generateCertificatePDFFromData(userCertificate, course);
      toast({
        title: "Certificado baixado!",
        description: "O PDF do certificado foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o certificado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

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

                {/* Certificate Section */}
                {course.certificateEnabled && (
                  <div className="border-t pt-4">
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
                          onClick={downloadCertificate}
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
                          <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-muted-foreground">
                              Certificado Indisponível
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {certificateEligibility.reason}
                            </p>
                            {certificateEligibility.courseCompletion && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Progresso: {certificateEligibility.courseCompletion.overallPercentage}% 
                                (mínimo: {certificateEligibility.courseCompletion.passScore}%)
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
                  </div>
                )}
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

        {/* Only show modules for non-in-person courses */}
        {course?.courseType !== 'in_person' && (
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
        )}

        {/* Student Performance Section for In-Person Courses */}
        {course?.courseType === 'in_person' && authData?.user && (
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
                            <h4 className="font-medium">
                              {grade.type === 'final_grade' ? 'Nota Final do Curso' : grade.moduleTitle || 'Módulo'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {grade.type === 'final_grade' ? 'Avaliada pelo instrutor em' : 'Avaliação do módulo em'} {' '}
                              {new Date(grade.gradedAt || grade.submittedAt).toLocaleDateString('pt-BR')}
                            </p>
                            {grade.feedback && (
                              <p className="text-sm mt-2 text-gray-600">
                                <strong>Feedback:</strong> {grade.feedback}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {grade.type === 'final_grade' 
                                ? Number(grade.gradeScale).toFixed(1)
                                : grade.percentage ? `${grade.percentage}%` : '-'
                              }
                            </div>
                            <Badge variant={grade.passed ? "default" : "destructive"}>
                              {grade.passed ? "Aprovado" : "Reprovado"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Overall Statistics */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">
                            {userGrades.length > 0 ? (
                              userGrades[0].type === 'final_grade' 
                                ? Number(userGrades[0].gradeScale).toFixed(1)
                                : userGrades[0].percentage ? `${userGrades[0].percentage}%` : '-'
                            ) : '-'}
                          </div>
                          <div className="text-sm text-muted-foreground">Nota Final</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">
                            {userGrades.length > 0 && userGrades[0].passed ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">Status</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
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
                      <div className="mt-4 text-center">
                        <div className="text-lg font-semibold">
                          {userAttendance.length > 0 ? 
                            Math.round((userAttendance.filter(r => r.attendanceStatus === 'present').length / userAttendance.length) * 100) 
                            : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Taxa de Presença</div>
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