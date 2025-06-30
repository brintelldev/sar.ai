import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { GradesDiary } from "@/components/grades-diary";
import { AttendanceDiary } from "@/components/attendance-diary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  ArrowLeft,
  Upload,
  Youtube,
  FileText,
  Video,
  File,
  Edit,
  Settings,
  BookOpen,
  Award,
  Download,
  Eye,
  GraduationCap,
  CheckCircle,
  UserPlus,
  Users,
  Calendar
} from "lucide-react";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: 'text' | 'video' | 'pdf' | 'youtube' | 'vimeo';
  videoUrl?: string;
  fileUrl?: string;
  duration?: string;
  orderIndex: number;
  isRequired: boolean;
  isPublished: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  courseType: string;
  duration: string;
  status: string;
  learningObjectives?: string[];
  certificateEnabled: boolean;
  certificateTemplate?: string;
  modules?: CourseModule[];
}

export function CourseEditor() {
  const [, params] = useRoute("/course-admin/:id");
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("info");
  const [certificateTemplate, setCertificateTemplate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const courseId = params?.id;

  const { data: course, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  const { data: modules } = useQuery({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules`),
    enabled: !!courseId
  });

  // Default certificate template
  const defaultCertificateTemplate = `
CERTIFICADO

{{organizationName}} certifica que

{{studentName}}

CPF nº {{studentCpf}}, concluiu o curso de {{courseTitle}}, com aproveitamento de {{grade}}% e duração de {{courseDuration}} horas, no período de {{startDate}} a {{completionDate}}.

{{city}}, {{issueDate}}.

Certificado digital nº: {{certificateId}}

___________________________
{{instructorName}}
{{instructorTitle}}
  `.trim();

  // Initialize certificate template when course loads
  React.useEffect(() => {
    if (course && !certificateTemplate) {
      setCertificateTemplate(course.certificateTemplate || defaultCertificateTemplate);
    }
  }, [course, certificateTemplate]);

  const updateCourseMutation = useMutation({
    mutationFn: (data: Partial<Course>) => apiRequest(`/api/courses/${courseId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Curso atualizado",
        description: "As alterações foram salvas com sucesso."
      });
    }
  });

  const handleSaveCourse = (formData: FormData) => {
    const courseData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      level: formData.get("level") as string,
      duration: formData.get("duration") as string,
      certificateEnabled: formData.get("certificateEnabled") === "on",
      learningObjectives: formData.get("objectives")?.toString().split('\n').filter(obj => obj.trim())
    };
    
    updateCourseMutation.mutate(courseData);
  };

  if (isLoading) {
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
          <h2 className="text-xl font-semibold mb-4">Curso não encontrado</h2>
          <Button onClick={() => navigate('/admin/courses')}>
            Voltar para Cursos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const modulesList = Array.isArray(modules) ? modules : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Cursos
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Curso</h1>
            <p className="text-muted-foreground">
              Configure as informações e módulos do curso
            </p>
          </div>
        </div>

        {/* Course Editor Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${course?.courseType === 'in_person' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="info">Informações Básicas</TabsTrigger>
            {course?.courseType !== 'in_person' && (
              <TabsTrigger value="modules">Gerenciar Módulos</TabsTrigger>
            )}
            {course?.courseType === 'in_person' && (
              <>
                <TabsTrigger value="grades">Diário de Notas</TabsTrigger>
                <TabsTrigger value="attendance">Diário de Presença</TabsTrigger>
              </>
            )}
            <TabsTrigger value="certificate">Certificado</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Curso</CardTitle>
                <CardDescription>
                  Configure as informações básicas do curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleSaveCourse(formData);
                }} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título do Curso</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={course.title}
                        placeholder="Ex: Introdução à Tecnologia"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={course.description}
                        placeholder="Descreva o conteúdo e objetivos do curso..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select name="category" defaultValue={course.category || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tecnologia">Tecnologia</SelectItem>
                            <SelectItem value="empreendedorismo">Empreendedorismo</SelectItem>
                            <SelectItem value="direitos">Direitos</SelectItem>
                            <SelectItem value="saude">Saúde</SelectItem>
                            <SelectItem value="comunicacao">Comunicação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="level">Nível</Label>
                        <Select name="level" defaultValue={course.level || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">Iniciante</SelectItem>
                            <SelectItem value="intermediario">Intermediário</SelectItem>
                            <SelectItem value="avancado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duração Estimada</Label>
                        <Input
                          id="duration"
                          name="duration"
                          defaultValue={course.duration ? `${Math.floor(Number(course.duration) / 3600)} horas` : ''}
                          placeholder="Ex: 4 horas"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="objectives">Objetivos de Aprendizagem</Label>
                      <Textarea
                        id="objectives"
                        name="objectives"
                        defaultValue={course.learningObjectives?.join('\n') || ''}
                        placeholder="Liste os objetivos de aprendizagem (um por linha)..."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500">
                        Digite um objetivo por linha
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="certificateEnabled"
                        name="certificateEnabled"
                        defaultChecked={course.certificateEnabled || false}
                      />
                      <Label htmlFor="certificateEnabled">Habilitar certificado de conclusão</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit" 
                      disabled={updateCourseMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateCourseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules and Content Tab */}
          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Editor Avançado de Módulos</CardTitle>
                <CardDescription>
                  Use o editor completo para criar módulos com múltiplos tipos de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Editor de Módulos Avançado
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Crie módulos ricos com texto, imagens, vídeos, PDFs, formulários e conteúdo incorporado.
                    O novo editor permite inserir quantos blocos de conteúdo desejar em cada módulo.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Texto Rico</span>
                    </div>
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Imagens</span>
                    </div>
                    <div className="text-center">
                      <Video className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Vídeos</span>
                    </div>
                    <div className="text-center">
                      <File className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">PDFs</span>
                    </div>
                    <div className="text-center">
                      <Settings className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Formulários</span>
                    </div>
                    <div className="text-center">
                      <Youtube className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Embeds</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Começar a Editar Módulos
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{modulesList.length}</div>
                    <div className="text-sm text-gray-500">Módulos Criados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {modulesList.filter(m => m.isRequired).length}
                    </div>
                    <div className="text-sm text-gray-500">Módulos Obrigatórios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {modulesList.reduce((total, m) => total + (Number(m.duration) || 30), 0)} min
                    </div>
                    <div className="text-sm text-gray-500">Duração Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificate Tab */}
          <TabsContent value="certificate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certificado de Conclusão
                </CardTitle>
                <CardDescription>
                  Configure o modelo de certificado que será gerado automaticamente quando o aluno concluir o curso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Certificate Template Editor */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="certificateTemplate" className="text-base font-medium">
                      Modelo do Certificado
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Use as variáveis disponíveis para personalizar o certificado. O texto será gerado automaticamente quando o aluno concluir o curso.
                    </p>
                    <Textarea
                      id="certificateTemplate"
                      placeholder="Digite o modelo do certificado..."
                      value={certificateTemplate}
                      onChange={(e) => setCertificateTemplate(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Available Variables */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Variáveis Disponíveis:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{studentName}}"}</code> - Nome do aluno</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{studentCpf}}"}</code> - CPF do aluno</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{courseTitle}}"}</code> - Título do curso</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{courseDuration}}"}</code> - Duração em horas</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{startDate}}"}</code> - Data de início</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{completionDate}}"}</code> - Data de conclusão</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{grade}}"}</code> - Nota final (%)</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{certificateId}}"}</code> - ID único do certificado</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{organizationName}}"}</code> - Nome da organização</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{instructorName}}"}</code> - Nome do instrutor</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{instructorTitle}}"}</code> - Cargo do instrutor</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{issueDate}}"}</code> - Data de emissão</div>
                      <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{"{{city}}"}</code> - Cidade</div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">Pré-visualização</Label>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar Certificado
                      </Button>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-lg min-h-[300px]">
                      <div className="text-center space-y-4">
                        <div className="text-2xl font-bold text-gray-800">CERTIFICADO</div>
                        <div className="text-base text-gray-700 whitespace-pre-line">
                          {certificateTemplate
                            .replace(/\{\{organizationName\}\}/g, "Instituto Esperança")
                            .replace(/\{\{studentName\}\}/g, "João Silva Santos")
                            .replace(/\{\{studentCpf\}\}/g, "123.456.789-00")
                            .replace(/\{\{courseTitle\}\}/g, course?.title || "Nome do Curso")
                            .replace(/\{\{courseDuration\}\}/g, course?.duration || "40")
                            .replace(/\{\{startDate\}\}/g, "10 de janeiro de 2025")
                            .replace(/\{\{completionDate\}\}/g, "30 de janeiro de 2025")
                            .replace(/\{\{grade\}\}/g, "95")
                            .replace(/\{\{certificateId\}\}/g, "CERT-2025-001234")
                            .replace(/\{\{instructorName\}\}/g, "Maria Silva")
                            .replace(/\{\{instructorTitle\}\}/g, "Instrutora do Curso")
                            .replace(/\{\{issueDate\}\}/g, "30 de janeiro de 2025")
                            .replace(/\{\{city\}\}/g, "São Paulo")
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        updateCourseMutation.mutate({
                          certificateTemplate,
                          certificateEnabled: true
                        });
                      }}
                      disabled={updateCourseMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateCourseMutation.isPending ? "Salvando..." : "Salvar Modelo"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Configure opções avançadas do curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Matrícula Automática</Label>
                      <p className="text-sm text-gray-600">
                        Permitir que beneficiários se matriculem automaticamente
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Certificado Digital</Label>
                      <p className="text-sm text-gray-600">
                        Gerar certificados automáticos na conclusão
                      </p>
                    </div>
                    <Switch defaultChecked={course?.certificateEnabled} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Notificações por Email</Label>
                      <p className="text-sm text-gray-600">
                        Enviar lembretes e atualizações por email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Diary Tab - Only for in-person courses */}
          {course?.courseType === 'in_person' && (
            <TabsContent value="grades" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    <div>
                      <CardTitle>Diário de Notas</CardTitle>
                      <CardDescription>
                        Gerencie as notas dos alunos matriculados no curso presencial
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <GradesDiary courseId={courseId} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Attendance Diary Tab - Only for in-person courses */}
          {course?.courseType === 'in_person' && (
            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    <div>
                      <CardTitle>Diário de Presença</CardTitle>
                      <CardDescription>
                        Controle a presença dos alunos nas aulas presenciais
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AttendanceDiary courseId={courseId} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}