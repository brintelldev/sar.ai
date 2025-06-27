import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Plus, 
  ArrowLeft,
  Upload,
  Youtube,
  FileText,
  Video,
  File,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Play,
  Settings,
  Users,
  CheckCircle,
  Clock,
  BookOpen
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
  duration: string;
  status: string;
  learningObjectives?: string[];
  certificateEnabled: boolean;
  modules?: CourseModule[];
}

export function CourseEditor() {
  const [, params] = useRoute("/course-admin/:id");
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("info");
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
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

  const createModuleMutation = useMutation({
    mutationFn: (moduleData: any) => apiRequest(`/api/courses/${courseId}/modules`, 'POST', moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setIsModuleDialogOpen(false);
      setEditingModule(null);
      toast({
        title: "Módulo criado",
        description: "O módulo foi adicionado ao curso."
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) => 
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setIsModuleDialogOpen(false);
      setEditingModule(null);
      toast({
        title: "Módulo atualizado",
        description: "As alterações foram salvas."
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      toast({
        title: "Módulo removido",
        description: "O módulo foi excluído do curso."
      });
    }
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (moduleIds: string[]) => 
      apiRequest(`/api/courses/${courseId}/modules/reorder`, 'PUT', { moduleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      toast({
        title: "Módulos reordenados",
        description: "A ordem dos módulos foi atualizada."
      });
    }
  });

  const handleSaveCourse = (formData: FormData) => {
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      level: formData.get('level'),
      duration: formData.get('duration'),
      certificateEnabled: formData.get('certificateEnabled') === 'on',
      learningObjectives: formData.get('learningObjectives')?.toString().split('\n').filter(obj => obj.trim())
    };

    updateCourseMutation.mutate(data);
  };

  const handleSaveModule = (formData: FormData) => {
    const moduleData = {
      title: formData.get('title'),
      description: formData.get('description'),
      content: formData.get('content'),
      contentType: formData.get('contentType'),
      videoUrl: formData.get('videoUrl'),
      duration: formData.get('duration'),
      isRequired: formData.get('isRequired') === 'on',
      isPublished: formData.get('isPublished') === 'on',
      orderIndex: modules?.length || 0
    };

    if (editingModule) {
      updateModuleMutation.mutate({ moduleId: editingModule.id, data: moduleData });
    } else {
      createModuleMutation.mutate(moduleData);
    }
  };

  const handlePublishCourse = () => {
    updateCourseMutation.mutate({ status: 'published' });
  };

  const handleUnpublishCourse = () => {
    updateCourseMutation.mutate({ status: 'draft' });
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirm('Tem certeza que deseja excluir este módulo?')) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const handleDragStart = (e: React.DragEvent, module: CourseModule) => {
    setDraggedModule(module);
    e.dataTransfer.effectAllowed = 'move';
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent, targetModule: CourseModule) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (!draggedModule || draggedModule.id === targetModule.id) {
      setDraggedModule(null);
      return;
    }

    const modulesList = Array.isArray(modules) ? [...modules] : [];
    const draggedIndex = modulesList.findIndex(m => m.id === draggedModule.id);
    const targetIndex = modulesList.findIndex(m => m.id === targetModule.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedModule(null);
      return;
    }

    // Reordenar a lista
    const [removed] = modulesList.splice(draggedIndex, 1);
    modulesList.splice(targetIndex, 0, removed);

    // Extrair apenas os IDs na nova ordem
    const newOrder = modulesList.map(m => m.id);
    
    reorderModulesMutation.mutate(newOrder);
    setDraggedModule(null);
  };

  const modulesList = Array.isArray(modules) ? modules : [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando curso...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Curso não encontrado</h2>
          <Button 
            onClick={() => navigate('/course-admin')}
            className="mt-4"
          >
            Voltar à administração
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/course-admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-1 mb-2">Edite as informações do curso e gerencie seus módulos de conteúdo</p>
              <div className="flex items-center gap-3">
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
                <span className="text-gray-600">Categoria: {course.category}</span>
                <span className="text-gray-600">Nível: {course.level}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            {course.status === 'draft' ? (
              <Button
                onClick={handlePublishCourse}
                disabled={updateCourseMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                Publicar Curso
              </Button>
            ) : (
              <Button
                onClick={handleUnpublishCourse}
                disabled={updateCourseMutation.isPending}
                variant="outline"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Despublicar
              </Button>
            )}
          </div>
        </div>

        {/* Course Editor Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações Básicas</TabsTrigger>
            <TabsTrigger value="modules">Gerenciar Módulos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Course Information Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Configure as informações principais do curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleSaveCourse(formData);
                }}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título do Curso</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={course?.title || ''}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={course?.description || ''}
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select name="category" defaultValue={course?.category || ''} required>
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
                        <Select name="level" defaultValue={course?.level || ''} required>
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
                          defaultValue={course?.duration ? `${Math.floor(course.duration / 3600)} horas` : ''}
                          placeholder="Ex: 4 horas"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="learningObjectives">Objetivos de Aprendizagem</Label>
                      <Textarea
                        id="learningObjectives"
                        name="learningObjectives"
                        defaultValue={course?.learningObjectives?.join('\n') || ''}
                        placeholder="Digite um objetivo por linha..."
                        rows={5}
                      />
                      <p className="text-sm text-gray-500">
                        Digite cada objetivo em uma linha separada
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="certificateEnabled" 
                        name="certificateEnabled"
                        defaultChecked={course?.certificateEnabled || false}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Módulos do Curso</CardTitle>
                    <CardDescription>
                      Organize o conteúdo em módulos sequenciais
                    </CardDescription>
                  </div>
                  
                  <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Módulo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingModule ? 'Editar Módulo' : 'Criar Novo Módulo'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure o conteúdo e materiais do módulo
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        handleSaveModule(formData);
                      }}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="module-title">Título do Módulo</Label>
                            <Input
                              id="module-title"
                              name="title"
                              defaultValue={editingModule?.title || ''}
                              placeholder="Ex: Introdução aos Smartphones"
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="module-description">Descrição</Label>
                            <Textarea
                              id="module-description"
                              name="description"
                              defaultValue={editingModule?.description || ''}
                              placeholder="Descreva o que será aprendido neste módulo..."
                              rows={3}
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="contentType">Tipo de Conteúdo</Label>
                              <Select name="contentType" defaultValue={editingModule?.contentType || 'text'} required>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto Explicativo</SelectItem>
                                  <SelectItem value="youtube">Vídeo YouTube</SelectItem>
                                  <SelectItem value="vimeo">Vídeo Vimeo</SelectItem>
                                  <SelectItem value="pdf">Documento PDF</SelectItem>
                                  <SelectItem value="video">Upload de Vídeo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="module-duration">Duração</Label>
                              <Input
                                id="module-duration"
                                name="duration"
                                defaultValue={editingModule?.duration || ''}
                                placeholder="Ex: 30 min"
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="videoUrl">URL do Vídeo (YouTube/Vimeo)</Label>
                            <Input
                              id="videoUrl"
                              name="videoUrl"
                              defaultValue={editingModule?.videoUrl || ''}
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="module-content">Conteúdo do Módulo</Label>
                            <Textarea
                              id="module-content"
                              name="content"
                              defaultValue={editingModule?.content || ''}
                              placeholder="Escreva o conteúdo textual do módulo..."
                              rows={8}
                              required
                            />
                            <p className="text-sm text-gray-500">
                              Suporte básico para formatação em texto simples
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="isRequired" 
                                name="isRequired"
                                defaultChecked={editingModule?.isRequired ?? true}
                              />
                              <Label htmlFor="isRequired">Módulo obrigatório</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id="isPublished" 
                                name="isPublished"
                                defaultChecked={editingModule?.isPublished ?? true}
                              />
                              <Label htmlFor="isPublished">Publicar módulo</Label>
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsModuleDialogOpen(false);
                              setEditingModule(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {editingModule ? "Atualizar Módulo" : "Criar Módulo"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {modulesList.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum módulo criado</h3>
                    <p className="text-gray-600 mb-4">Comece adicionando módulos ao seu curso.</p>
                    <Button 
                      onClick={() => setIsModuleDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Módulo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modulesList
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((module, index) => (
                        <div 
                          key={module.id} 
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                                  {index + 1}
                                </span>
                                {module.contentType === 'youtube' && <Youtube className="w-4 h-4 text-red-600" />}
                                {module.contentType === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                                {module.contentType === 'pdf' && <File className="w-4 h-4 text-red-600" />}
                                {module.contentType === 'text' && <FileText className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{module.title}</h4>
                                <p className="text-sm text-gray-600">{module.description}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>{module.duration}</span>
                                  {module.isRequired && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
                                  {!module.isPublished && <Badge variant="secondary" className="text-xs">Rascunho</Badge>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingModule(module);
                                  setIsModuleDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteModuleMutation.mutate(module.id)}
                                disabled={deleteModuleMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
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
                    <Switch defaultChecked={course.certificateEnabled} />
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
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Nota Mínima para Aprovação</Label>
                    <Select defaultValue="70">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60%</SelectItem>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}