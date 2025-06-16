import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Upload, Video, FileText, Link, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  content: any;
  videoUrl: string | null;
  materials: any;
  duration: number;
  isRequired: boolean;
}

interface ContentBlock {
  type: 'text' | 'video' | 'file' | 'link';
  content: string;
  title?: string;
  url?: string;
  metadata?: any;
}

export function ModuleEditor() {
  const { courseId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Get course modules
  const { data: moduleData, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'modules'],
    enabled: !!courseId
  });

  // Get course details
  const { data: course } = useQuery({
    queryKey: ['/api/courses', courseId],
    enabled: !!courseId
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: (moduleData: any) => apiRequest(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData)
    }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Módulo criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setIsEditingModule(false);
      setCurrentModule(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar módulo.",
        variant: "destructive"
      });
    }
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, updates }: { moduleId: string; updates: any }) => 
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setIsEditingModule(false);
      setCurrentModule(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar módulo.",
        variant: "destructive"
      });
    }
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => 
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Módulo excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir módulo.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (moduleData) {
      setModules(Array.isArray(moduleData) ? moduleData : []);
    }
  }, [moduleData]);

  const handleCreateModule = () => {
    const newModule = {
      title: "Novo Módulo",
      description: "",
      order: modules.length + 1,
      content: { blocks: [] },
      videoUrl: null,
      materials: [],
      duration: 30,
      isRequired: true
    };
    setCurrentModule(newModule as CourseModule);
    setContentBlocks([]);
    setIsEditingModule(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setCurrentModule(module);
    setContentBlocks(module.content?.blocks || []);
    setIsEditingModule(true);
  };

  const handleSaveModule = () => {
    if (!currentModule) return;

    const moduleData = {
      ...currentModule,
      content: { blocks: contentBlocks }
    };

    if (currentModule.id) {
      updateModuleMutation.mutate({
        moduleId: currentModule.id,
        updates: moduleData
      });
    } else {
      createModuleMutation.mutate(moduleData);
    }
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      type,
      content: type === 'text' ? 'Digite seu conteúdo aqui...' : '',
      title: type === 'file' ? 'Arquivo' : type === 'link' ? 'Link' : undefined,
      url: type === 'video' || type === 'link' ? '' : undefined
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (index: number, updates: Partial<ContentBlock>) => {
    const updatedBlocks = [...contentBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], ...updates };
    setContentBlocks(updatedBlocks);
  };

  const removeContentBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const extractVideoId = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    
    if (youtubeMatch) return { platform: 'youtube', id: youtubeMatch[1] };
    if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };
    return null;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando módulos...</div>
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
            onClick={() => navigate('/admin/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Cursos
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editor de Módulos</h1>
            <p className="text-muted-foreground">
              Gerencie o conteúdo dos módulos do curso: {course?.title}
            </p>
          </div>
        </div>

        {!isEditingModule ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Módulos do Curso</h2>
              <Button onClick={handleCreateModule} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Módulo
              </Button>
            </div>

            {modules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum módulo encontrado</h3>
                  <p className="text-muted-foreground mb-4">Comece criando o primeiro módulo do curso.</p>
                  <Button onClick={handleCreateModule}>Criar Primeiro Módulo</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {modules.sort((a, b) => a.order - b.order).map((module) => (
                  <Card key={module.id} className="cursor-pointer hover:bg-accent/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <Badge variant="outline">Módulo {module.order}</Badge>
                            {module.isRequired && <Badge variant="default">Obrigatório</Badge>}
                          </div>
                          {module.description && (
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>⏱ {module.duration} min</span>
                            {module.videoUrl && <span>📹 Vídeo incluído</span>}
                            <span>📄 {module.content?.blocks?.length || 0} blocos de conteúdo</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditModule(module)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteModuleMutation.mutate(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentModule?.id ? 'Editar Módulo' : 'Criar Novo Módulo'}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingModule(false);
                    setCurrentModule(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveModule} disabled={!currentModule?.title}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Módulo
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título do Módulo</label>
                  <Input
                    value={currentModule?.title || ''}
                    onChange={(e) => setCurrentModule(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Digite o título do módulo..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={currentModule?.description || ''}
                    onChange={(e) => setCurrentModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Descrição do módulo..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Duração (minutos)</label>
                    <Input
                      type="number"
                      value={currentModule?.duration || 30}
                      onChange={(e) => setCurrentModule(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 30 } : null)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ordem</label>
                    <Input
                      type="number"
                      value={currentModule?.order || 1}
                      onChange={(e) => setCurrentModule(prev => prev ? { ...prev, order: parseInt(e.target.value) || 1 } : null)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">URL do Vídeo (YouTube/Vimeo)</label>
                  <Input
                    value={currentModule?.videoUrl || ''}
                    onChange={(e) => setCurrentModule(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  />
                  {currentModule?.videoUrl && extractVideoId(currentModule.videoUrl) && (
                    <div className="mt-2 p-3 bg-accent rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        ✅ Vídeo detectado: {extractVideoId(currentModule.videoUrl)?.platform}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Módulo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione blocos de conteúdo para estruturar o material de aprendizagem
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('text')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Adicionar Texto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('video')}
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Adicionar Vídeo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('file')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Adicionar Arquivo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('link')}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Adicionar Link
                  </Button>
                </div>

                <Separator />

                {contentBlocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Adicione blocos de conteúdo para estruturar o módulo
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contentBlocks.map((block, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{block.type}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContentBlock(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {block.type === 'text' && (
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                              placeholder="Digite o conteúdo de texto..."
                              className="min-h-[100px]"
                            />
                          )}
                          {block.type === 'video' && (
                            <div className="space-y-2">
                              <Input
                                value={block.url || ''}
                                onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                placeholder="URL do vídeo (YouTube, Vimeo)..."
                              />
                              <Textarea
                                value={block.content}
                                onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                placeholder="Descrição ou transcrição do vídeo..."
                              />
                            </div>
                          )}
                          {block.type === 'file' && (
                            <div className="space-y-2">
                              <Input
                                value={block.title || ''}
                                onChange={(e) => updateContentBlock(index, { title: e.target.value })}
                                placeholder="Nome do arquivo..."
                              />
                              <Input
                                value={block.url || ''}
                                onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                placeholder="URL do arquivo (PDF, DOC, etc.)..."
                              />
                              <Textarea
                                value={block.content}
                                onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                placeholder="Descrição do arquivo..."
                              />
                            </div>
                          )}
                          {block.type === 'link' && (
                            <div className="space-y-2">
                              <Input
                                value={block.title || ''}
                                onChange={(e) => updateContentBlock(index, { title: e.target.value })}
                                placeholder="Título do link..."
                              />
                              <Input
                                value={block.url || ''}
                                onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                placeholder="URL do link..."
                              />
                              <Textarea
                                value={block.content}
                                onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                placeholder="Descrição do link..."
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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