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
  return (
    <MainLayout>
      <div className="space-y-6">
