import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Upload, Video, FileText, Link, Save, Copy, CheckCircle, AlertCircle } from "lucide-react";
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

                          {/* Bloco de Formulário Avançado */}
                          {block.type === 'form' && (
                            <FormEditorComponent 
                              block={block}
                              onUpdateBlock={(updates) => updateContentBlock(index, updates)}
                            />
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

// Componente integrado para editar formulários avançados
interface FormEditorComponentProps {
  block: ContentBlock;
  onUpdateBlock: (updates: Partial<ContentBlock>) => void;
}

function FormEditorComponent({ block, onUpdateBlock }: FormEditorComponentProps) {
  const [showPreview, setShowPreview] = useState(false);

  const duplicateField = (fieldIndex: number) => {
    if (!block.formFields) return;
    
    const fieldToDuplicate = block.formFields[fieldIndex];
    const duplicatedField = {
      ...fieldToDuplicate,
      id: Date.now().toString(),
      label: fieldToDuplicate.label + ' (Cópia)'
    };
    
    const updatedFields = [...block.formFields];
    updatedFields.splice(fieldIndex + 1, 0, duplicatedField);
    onUpdateBlock({ formFields: updatedFields });
  };

  const moveField = (fieldIndex: number, direction: 'up' | 'down') => {
    if (!block.formFields) return;
    
    const updatedFields = [...block.formFields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedFields.length) {
      [updatedFields[fieldIndex], updatedFields[targetIndex]] = [updatedFields[targetIndex], updatedFields[fieldIndex]];
      onUpdateBlock({ formFields: updatedFields });
    }
  };

  const addQuickTemplate = (templateType: string) => {
    const templates: Record<string, FormField> = {
      'texto_curto': {
        id: Date.now().toString(),
        type: 'text',
        label: 'Sua resposta:',
        placeholder: 'Digite sua resposta aqui...',
        required: true,
        points: 5,
        correctAnswer: '',
        explanation: ''
      },
      'texto_longo': {
        id: Date.now().toString(),
        type: 'textarea',
        label: 'Desenvolva sua resposta (mínimo 100 palavras):',
        placeholder: 'Escreva uma resposta detalhada e fundamentada...',
        required: true,
        points: 10,
        correctAnswer: '',
        explanation: ''
      },
      'multipla_escolha': {
        id: Date.now().toString(),
        type: 'radio',
        label: 'Selecione a alternativa correta:',
        options: ['a) Primeira opção', 'b) Segunda opção', 'c) Terceira opção', 'd) Quarta opção'],
        required: true,
        points: 5,
        correctAnswer: 'a) Primeira opção',
        explanation: 'Explique por que esta é a resposta correta'
      },
      'verdadeiro_falso': {
        id: Date.now().toString(),
        type: 'radio',
        label: 'A afirmação a seguir é verdadeira ou falsa?',
        options: ['Verdadeiro', 'Falso'],
        required: true,
        points: 3,
        correctAnswer: 'Verdadeiro',
        explanation: 'Justificativa da resposta'
      },
      'lista_opcoes': {
        id: Date.now().toString(),
        type: 'select',
        label: 'Escolha uma das opções:',
        options: ['Selecione uma opção', 'Opção 1', 'Opção 2', 'Opção 3'],
        required: true,
        points: 3,
        correctAnswer: 'Opção 1',
        explanation: ''
      }
    };
    
    const newField = templates[templateType];
    if (newField) {
      const updatedFields = [...(block.formFields || []), newField];
      onUpdateBlock({ formFields: updatedFields });
    }
  };

  const calculateTotalPoints = () => {
    return block.formFields?.reduce((total, field) => total + (field.points || 0), 0) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Instruções e configurações gerais */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Instruções do Exercício</label>
          <Textarea
            value={block.content || ''}
            onChange={(e) => onUpdateBlock({ content: e.target.value })}
            placeholder="Explique o exercício, critérios de avaliação, tempo estimado..."
            rows={3}
          />
        </div>
        
        {/* Estatísticas do formulário */}
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline">
            {block.formFields?.length || 0} Questões
          </Badge>
          <Badge variant="outline">
            {calculateTotalPoints()} Pontos Total
          </Badge>
        </div>
      </div>

      {/* Botões de templates rápidos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Templates Rápidos</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Visualizar'} Preview
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickTemplate('texto_curto')}
          >
            📝 Texto Curto
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickTemplate('texto_longo')}
          >
            📄 Texto Longo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickTemplate('multipla_escolha')}
          >
            ◉ Múltipla Escolha
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickTemplate('verdadeiro_falso')}
          >
            ✓✗ Verdadeiro/Falso
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuickTemplate('lista_opcoes')}
          >
            📋 Lista de Opções
          </Button>
        </div>
      </div>

      {/* Preview do formulário */}
      {showPreview && block.formFields && block.formFields.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              👁️ Preview do Formulário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {block.formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium block">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.points && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {field.points} pts
                    </Badge>
                  )}
                </label>
                
                {field.type === 'text' && (
                  <Input placeholder={field.placeholder || ''} disabled />
                )}
                
                {field.type === 'textarea' && (
                  <Textarea placeholder={field.placeholder || ''} rows={3} disabled />
                )}
                
                {field.type === 'select' && (
                  <select className="w-full p-2 border rounded" disabled>
                    {field.options?.map((option, i) => (
                      <option key={i} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((option, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="radio" name={field.id} disabled />
                        <span className="text-sm">{option}</span>
                        {option === field.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {field.type === 'checkbox' && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled />
                    <span className="text-sm">{field.label}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Editor de campos */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Campos do Formulário</h4>
        
        {block.formFields?.map((field, fieldIndex) => (
          <Card key={field.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {field.type === 'text' ? '📝' : 
                     field.type === 'textarea' ? '📄' : 
                     field.type === 'radio' ? '◉' : 
                     field.type === 'select' ? '📋' : '☑️'}
                  </Badge>
                  <span className="text-sm font-medium">Questão {fieldIndex + 1}</span>
                  {field.points && (
                    <Badge variant="secondary" className="text-xs">
                      {field.points} pts
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveField(fieldIndex, 'up')}
                    disabled={fieldIndex === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveField(fieldIndex, 'down')}
                    disabled={fieldIndex === (block.formFields?.length || 0) - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateField(fieldIndex)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedFields = block.formFields?.filter((_, i) => i !== fieldIndex) || [];
                      onUpdateBlock({ formFields: updatedFields });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Configurações básicas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tipo de Campo</label>
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const updatedFields = [...(block.formFields || [])];
                      updatedFields[fieldIndex] = { ...field, type: e.target.value as FormField['type'] };
                      onUpdateBlock({ formFields: updatedFields });
                    }}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="textarea">Texto Longo</option>
                    <option value="select">Lista de Seleção</option>
                    <option value="radio">Múltipla Escolha</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => {
                        const updatedFields = [...(block.formFields || [])];
                        updatedFields[fieldIndex] = { ...field, required: e.target.checked };
                        onUpdateBlock({ formFields: updatedFields });
                      }}
                      className="mr-2"
                    />
                    <label className="text-xs">Obrigatório</label>
                  </div>
                </div>
              </div>
              
              {/* Pergunta */}
              <div>
                <label className="text-xs text-muted-foreground">Pergunta / Enunciado</label>
                <Textarea
                  value={field.label}
                  onChange={(e) => {
                    const updatedFields = [...(block.formFields || [])];
                    updatedFields[fieldIndex] = { ...field, label: e.target.value };
                    onUpdateBlock({ formFields: updatedFields });
                  }}
                  placeholder="Escreva a pergunta ou enunciado completo..."
                  rows={2}
                  className="text-sm"
                />
              </div>
              
              {/* Placeholder (apenas para text e textarea) */}
              {(field.type === 'text' || field.type === 'textarea') && (
                <div>
                  <label className="text-xs text-muted-foreground">Texto de Exemplo (Placeholder)</label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => {
                      const updatedFields = [...(block.formFields || [])];
                      updatedFields[fieldIndex] = { ...field, placeholder: e.target.value };
                      onUpdateBlock({ formFields: updatedFields });
                    }}
                    placeholder="Ex: Digite sua resposta aqui..."
                    className="text-sm"
                  />
                </div>
              )}
              
              {/* Opções (para select e radio) */}
              {(field.type === 'select' || field.type === 'radio') && (
                <div>
                  <label className="text-xs text-muted-foreground">Opções de Resposta</label>
                  <Textarea
                    value={field.options?.join('\n') || ''}
                    onChange={(e) => {
                      const updatedFields = [...(block.formFields || [])];
                      updatedFields[fieldIndex] = { 
                        ...field, 
                        options: e.target.value.split('\n').filter(o => o.trim()) 
                      };
                      onUpdateBlock({ formFields: updatedFields });
                    }}
                    placeholder="Uma opção por linha&#10;a) Primeira opção&#10;b) Segunda opção&#10;c) Terceira opção"
                    rows={4}
                    className="text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Dica: Use prefixos como a), b), c) ou 1., 2., 3. para melhor organização
                  </p>
                </div>
              )}
              
              {/* Configurações de avaliação */}
              <div className="border-t pt-4 space-y-3">
                <h5 className="text-xs font-medium text-muted-foreground">⚖️ Configurações de Avaliação</h5>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Pontuação</label>
                    <Input
                      type="number"
                      value={field.points || 1}
                      onChange={(e) => {
                        const updatedFields = [...(block.formFields || [])];
                        updatedFields[fieldIndex] = { ...field, points: parseInt(e.target.value) || 1 };
                        onUpdateBlock({ formFields: updatedFields });
                      }}
                      min="1"
                      max="100"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Resposta Correta</label>
                    {field.type === 'select' || field.type === 'radio' ? (
                      <select
                        value={field.correctAnswer as string || ''}
                        onChange={(e) => {
                          const updatedFields = [...(block.formFields || [])];
                          updatedFields[fieldIndex] = { ...field, correctAnswer: e.target.value };
                          onUpdateBlock({ formFields: updatedFields });
                        }}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">Selecione a resposta correta</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={field.correctAnswer as string || ''}
                        onChange={(e) => {
                          const updatedFields = [...(block.formFields || [])];
                          updatedFields[fieldIndex] = { ...field, correctAnswer: e.target.value };
                          onUpdateBlock({ formFields: updatedFields });
                        }}
                        placeholder="Resposta esperada ou palavras-chave"
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Explicação da Resposta (Feedback)</label>
                  <Textarea
                    value={field.explanation || ''}
                    onChange={(e) => {
                      const updatedFields = [...(block.formFields || [])];
                      updatedFields[fieldIndex] = { ...field, explanation: e.target.value };
                      onUpdateBlock({ formFields: updatedFields });
                    }}
                    placeholder="Explique por que esta é a resposta correta ou dê dicas para o aluno..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!block.formFields || block.formFields.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma questão foi adicionada ainda.
              </p>
              <p className="text-xs text-muted-foreground">
                Use os templates rápidos acima para começar a criar seu formulário de exercício.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}