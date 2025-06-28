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
  orderIndex: number;
  content: any;
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
  status: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'form' | 'embed';
  title?: string;
  content?: string;
  url?: string;
  embedCode?: string;
  formFields?: FormField[];
  metadata?: any;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  correctAnswer?: string | string[]; // resposta correta para avaliação
  points?: number; // pontos para esta questão
  explanation?: string; // explicação da resposta correta
}

export function ModuleEditor() {
  const { courseId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModule, setCurrentModule] = useState<Partial<CourseModule> | null>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Get course modules
  const { data: moduleData, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'modules'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules`),
    enabled: !!courseId
  });

  // Get course details
  const { data: course } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: (moduleData: any) => apiRequest(`/api/courses/${courseId}/modules`, 'POST', moduleData),
    onSuccess: (newModule) => {
      toast({
        title: "Sucesso",
        description: "Módulo criado com sucesso!",
      });
      
      // Atualizar o módulo atual com os dados do módulo criado
      if (newModule) {
        setCurrentModule(newModule);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      
      // Continuar no modo de edição com o módulo recém-criado
      // setIsEditingModule(false);
      // setCurrentModule(null);
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
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, 'PATCH', updates),
    onSuccess: (updatedModule) => {
      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso!",
      });
      
      // Atualizar o módulo atual com os dados salvos para manter o estado
      if (currentModule && updatedModule) {
        setCurrentModule(updatedModule);
      }
      
      // Invalidar apenas se necessário e não sair do modo de edição
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      
      // Não sair do modo de edição para permitir continuar editando
      // setIsEditingModule(false);
      // setCurrentModule(null);
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
      apiRequest(`/api/courses/${courseId}/modules/${moduleId}`, 'DELETE'),
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
      const modulesList = Array.isArray(moduleData) ? moduleData : [];
      console.log('Modules loaded:', modulesList);
      setModules(modulesList);
    }
  }, [moduleData]);

  const handleCreateModule = () => {
    const newModule = {
      title: "Novo Módulo",
      description: "",
      orderIndex: modules.length + 1,
      content: { blocks: [] },
      videoUrl: null,
      materials: [],
      duration: 30,
      isRequired: true
    };
    setCurrentModule(newModule as Partial<CourseModule>);
    setContentBlocks([]);
    setIsEditingModule(true);
  };

  const handleEditModule = (module: CourseModule) => {
    // Carregar dados específicos do módulo
    const moduleToEdit = {
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      content: module.content,
      videoUrl: module.videoUrl,
      materials: module.materials,
      duration: module.duration,
      isRequired: module.isRequired
    };
    
    setCurrentModule(moduleToEdit);
    setContentBlocks(module.content?.blocks || []);
    setIsEditingModule(true);
    
    console.log('Editing module:', moduleToEdit);
  };

  const handleSaveModule = () => {
    if (!currentModule) return;

    // Preparar dados limpos sem campos de timestamp que causam problemas
    const moduleData = {
      title: currentModule.title,
      description: currentModule.description,
      duration: currentModule.duration || 30,
      orderIndex: currentModule.orderIndex || modules.length + 1,
      content: { blocks: contentBlocks },
      videoUrl: currentModule.videoUrl,
      materials: currentModule.materials,
      isRequired: currentModule.isRequired !== undefined ? currentModule.isRequired : true,
      ...(currentModule.id ? {} : { courseId })
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
      id: Date.now().toString(),
      type,
      title: type === 'text' ? 'Texto' : 
            type === 'image' ? 'Imagem' :
            type === 'video' ? 'Vídeo' :
            type === 'pdf' ? 'Arquivo PDF' :
            type === 'form' ? 'Formulário de Exercício' :
            type === 'embed' ? 'Conteúdo Incorporado' : 'Conteúdo',
      content: type === 'text' ? 'Digite seu conteúdo aqui...' : '',
      url: type === 'image' || type === 'video' || type === 'pdf' ? '' : undefined,
      embedCode: type === 'embed' ? '' : undefined,
      formFields: type === 'form' ? [] : undefined
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
              Gerencie o conteúdo dos módulos do curso: {course?.title || 'Carregando...'}
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
                {modules.sort((a, b) => a.orderIndex - b.orderIndex).map((module) => (
                  <Card key={module.id} className="cursor-pointer hover:bg-accent/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <Badge variant="outline">Módulo {module.orderIndex}</Badge>
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
                  Voltar à Lista
                </Button>
                <Button onClick={handleSaveModule} disabled={!currentModule?.title}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar e Continuar
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas do Módulo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure o nome, apresentação e informações gerais do módulo
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Módulo</label>
                  <Input
                    value={currentModule?.title || ''}
                    onChange={(e) => {
                      console.log('Title change:', e.target.value);
                      console.log('Current module before:', currentModule);
                      setCurrentModule(prev => prev ? { ...prev, title: e.target.value } : null);
                    }}
                    placeholder="Ex: Introdução ao Empreendedorismo Digital"
                  />
                  {/* Debug info */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Debug: {currentModule?.id ? 'Editando módulo existente' : 'Criando novo módulo'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Apresentação do Módulo</label>
                  <Textarea
                    value={currentModule?.description || ''}
                    onChange={(e) => setCurrentModule(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Apresente o módulo aos alunos: objetivos, o que aprenderão, importância do conteúdo..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta apresentação será exibida aos alunos antes do conteúdo do módulo
                  </p>
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
                    onClick={() => addContentBlock('image')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Adicionar Imagem
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
                    onClick={() => addContentBlock('pdf')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Adicionar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('embed')}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Incorporar Conteúdo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock('form')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Criar Formulário
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
                      <Card key={block.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{block.title}</Badge>
                              <span className="text-sm text-muted-foreground">Bloco {index + 1}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContentBlock(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          
                          {/* Título do bloco */}
                          <div>
                            <label className="text-sm font-medium">Título do Bloco</label>
                            <Input
                              value={block.title || ''}
                              onChange={(e) => updateContentBlock(index, { title: e.target.value })}
                              placeholder="Digite o título deste bloco..."
                            />
                          </div>

                          {/* Bloco de Texto */}
                          {block.type === 'text' && (
                            <div>
                              <label className="text-sm font-medium">Conteúdo de Texto</label>
                              <Textarea
                                value={block.content || ''}
                                onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                placeholder="Digite o conteúdo de texto aqui. Você pode usar formatação básica em Markdown..."
                                className="min-h-[150px]"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Suporte para Markdown: **negrito**, *itálico*, # títulos, etc.
                              </p>
                            </div>
                          )}

                          {/* Bloco de Imagem */}
                          {block.type === 'image' && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">URL da Imagem</label>
                                <Input
                                  value={block.url || ''}
                                  onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                  placeholder="https://exemplo.com/imagem.jpg"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Descrição da Imagem</label>
                                <Textarea
                                  value={block.content || ''}
                                  onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                  placeholder="Descreva a imagem para acessibilidade e contexto..."
                                  rows={3}
                                />
                              </div>
                              {block.url && (
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                                  <img
                                    src={block.url}
                                    alt={block.content || 'Preview'}
                                    className="max-w-full h-auto max-h-48 rounded"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bloco de Vídeo */}
                          {block.type === 'video' && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">URL do Vídeo</label>
                                <Input
                                  value={block.url || ''}
                                  onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                  placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Suporta YouTube, Vimeo e links de vídeo diretos
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Descrição do Vídeo</label>
                                <Textarea
                                  value={block.content || ''}
                                  onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                  placeholder="Descreva o conteúdo do vídeo, pontos principais a observar..."
                                  rows={3}
                                />
                              </div>
                              {block.url && extractVideoId(block.url) && (
                                <div className="p-3 bg-accent rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    ✅ Vídeo detectado: {extractVideoId(block.url)?.platform}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bloco de PDF */}
                          {block.type === 'pdf' && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">URL do Arquivo PDF</label>
                                <Input
                                  value={block.url || ''}
                                  onChange={(e) => updateContentBlock(index, { url: e.target.value })}
                                  placeholder="https://exemplo.com/documento.pdf"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Descrição do Documento</label>
                                <Textarea
                                  value={block.content || ''}
                                  onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                  placeholder="Descreva o conteúdo do PDF, o que o aluno deve focar..."
                                  rows={3}
                                />
                              </div>
                              {block.url && (
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    📄 Documento PDF será incorporado no módulo
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bloco de Conteúdo Incorporado */}
                          {block.type === 'embed' && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Código de Incorporação</label>
                                <Textarea
                                  value={block.embedCode || ''}
                                  onChange={(e) => updateContentBlock(index, { embedCode: e.target.value })}
                                  placeholder="Cole aqui o código HTML de incorporação (iframe, embed, etc.)"
                                  rows={4}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Por exemplo: código de incorporação do YouTube, Google Forms, apresentações, etc.
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Descrição do Conteúdo</label>
                                <Textarea
                                  value={block.content || ''}
                                  onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                  placeholder="Explique o que o aluno encontrará neste conteúdo incorporado..."
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}

                          {/* Bloco de Formulário */}
                          {block.type === 'form' && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Instruções do Exercício</label>
                                <Textarea
                                  value={block.content || ''}
                                  onChange={(e) => updateContentBlock(index, { content: e.target.value })}
                                  placeholder="Explique o exercício, o que o aluno deve fazer, critérios de avaliação..."
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium">Campos do Formulário</label>
                                  <div className="flex gap-2">
                                    <select
                                      className="text-xs border rounded px-2 py-1"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          const templates: Record<string, FormField> = {
                                            'texto': {
                                              id: Date.now().toString(),
                                              type: 'text',
                                              label: 'Qual é a sua resposta?',
                                              placeholder: 'Digite sua resposta aqui...',
                                              required: true,
                                              points: 5,
                                              correctAnswer: '',
                                              explanation: ''
                                            },
                                            'paragrafo': {
                                              id: Date.now().toString(),
                                              type: 'textarea',
                                              label: 'Desenvolva sua resposta:',
                                              placeholder: 'Escreva uma resposta detalhada...',
                                              required: true,
                                              points: 10,
                                              correctAnswer: '',
                                              explanation: ''
                                            },
                                            'multipla': {
                                              id: Date.now().toString(),
                                              type: 'radio',
                                              label: 'Selecione a opção correta:',
                                              options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
                                              required: true,
                                              points: 5,
                                              correctAnswer: 'Opção A',
                                              explanation: ''
                                            },
                                            'selecao': {
                                              id: Date.now().toString(),
                                              type: 'select',
                                              label: 'Escolha uma opção:',
                                              options: ['Escolha uma opção', 'Primeira opção', 'Segunda opção', 'Terceira opção'],
                                              required: true,
                                              points: 5,
                                              correctAnswer: 'Primeira opção',
                                              explanation: ''
                                            },
                                            'checkbox': {
                                              id: Date.now().toString(),
                                              type: 'checkbox',
                                              label: 'Marque esta opção se concordar',
                                              required: false,
                                              points: 2,
                                              correctAnswer: 'true',
                                              explanation: ''
                                            }
                                          };
                                          
                                          const newField = templates[e.target.value];
                                          if (newField) {
                                            const updatedFields = [...(block.formFields || []), newField];
                                            updateContentBlock(index, { formFields: updatedFields });
                                          }
                                          e.target.value = '';
                                        }
                                      }}
                                    >
                                      <option value="">+ Adicionar Campo</option>
                                      <option value="texto">📝 Pergunta de Texto</option>
                                      <option value="paragrafo">📄 Resposta Longa</option>
                                      <option value="multipla">◉ Múltipla Escolha</option>
                                      <option value="selecao">📋 Lista de Opções</option>
                                      <option value="checkbox">☑️ Concordo/Confirmo</option>
                                    </select>
                                  </div>
                                </div>
                                
                                {block.formFields?.map((field, fieldIndex) => (
                                  <Card key={field.id} className="p-3">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Campo {fieldIndex + 1}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const updatedFields = block.formFields?.filter((_, i) => i !== fieldIndex) || [];
                                            updateContentBlock(index, { formFields: updatedFields });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs">Tipo</label>
                                          <select
                                            value={field.type}
                                            onChange={(e) => {
                                              const updatedFields = [...(block.formFields || [])];
                                              updatedFields[fieldIndex] = { ...field, type: e.target.value as FormField['type'] };
                                              updateContentBlock(index, { formFields: updatedFields });
                                            }}
                                            className="w-full p-1 border rounded text-sm"
                                          >
                                            <option value="text">Texto</option>
                                            <option value="textarea">Texto Longo</option>
                                            <option value="select">Seleção</option>
                                            <option value="radio">Múltipla Escolha</option>
                                            <option value="checkbox">Checkbox</option>
                                          </select>
                                        </div>
                                        <div className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => {
                                              const updatedFields = [...(block.formFields || [])];
                                              updatedFields[fieldIndex] = { ...field, required: e.target.checked };
                                              updateContentBlock(index, { formFields: updatedFields });
                                            }}
                                            className="mr-2"
                                          />
                                          <label className="text-xs">Obrigatório</label>
                                        </div>
                                      </div>
                                      <Input
                                        value={field.label}
                                        onChange={(e) => {
                                          const updatedFields = [...(block.formFields || [])];
                                          updatedFields[fieldIndex] = { ...field, label: e.target.value };
                                          updateContentBlock(index, { formFields: updatedFields });
                                        }}
                                        placeholder="Pergunta ou etiqueta do campo"
                                        className="text-sm"
                                      />
                                      {(field.type === 'select' || field.type === 'radio') && (
                                        <Textarea
                                          value={field.options?.join('\n') || ''}
                                          onChange={(e) => {
                                            const updatedFields = [...(block.formFields || [])];
                                            updatedFields[fieldIndex] = { ...field, options: e.target.value.split('\n').filter(o => o.trim()) };
                                            updateContentBlock(index, { formFields: updatedFields });
                                          }}
                                          placeholder="Uma opção por linha"
                                          rows={3}
                                          className="text-sm"
                                        />
                                      )}
                                      
                                      {/* Campos para avaliação automática */}
                                      {(field.type === 'select' || field.type === 'radio' || field.type === 'text') && (
                                        <div className="space-y-2 border-t pt-2">
                                          <p className="text-xs font-medium text-muted-foreground">Configurações de Avaliação</p>
                                          
                                          <Input
                                            value={field.correctAnswer as string || ''}
                                            onChange={(e) => {
                                              const updatedFields = [...(block.formFields || [])];
                                              updatedFields[fieldIndex] = { ...field, correctAnswer: e.target.value };
                                              updateContentBlock(index, { formFields: updatedFields });
                                            }}
                                            placeholder={field.type === 'text' ? 'Resposta correta esperada' : 'Digite a opção correta'}
                                            className="text-sm"
                                          />
                                          
                                          <div className="flex gap-2">
                                            <Input
                                              type="number"
                                              value={field.points || 1}
                                              onChange={(e) => {
                                                const updatedFields = [...(block.formFields || [])];
                                                updatedFields[fieldIndex] = { ...field, points: parseInt(e.target.value) || 1 };
                                                updateContentBlock(index, { formFields: updatedFields });
                                              }}
                                              placeholder="Pontos"
                                              min="1"
                                              max="100"
                                              className="text-sm w-20"
                                            />
                                            <Input
                                              value={field.explanation || ''}
                                              onChange={(e) => {
                                                const updatedFields = [...(block.formFields || [])];
                                                updatedFields[fieldIndex] = { ...field, explanation: e.target.value };
                                                updateContentBlock(index, { formFields: updatedFields });
                                              }}
                                              placeholder="Explicação da resposta (opcional)"
                                              className="text-sm flex-1"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                ))}
                                
                                {(!block.formFields || block.formFields.length === 0) && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
                                  </p>
                                )}
                              </div>
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