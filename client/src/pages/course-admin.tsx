import { useState } from "react";
import { Link, useLocation } from "wouter";
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
import { 
  Plus, 
  BookOpen, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Youtube,
  FileText,
  Settings,
  BarChart3
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  status: string;
  createdAt: string;
  enrolledCount?: number;
  completionRate?: number;
}

export function CourseAdmin() {
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses/admin'],
    queryFn: () => apiRequest('/api/courses/admin')
  });

  const createCourseMutation = useMutation({
    mutationFn: (courseData: any) => apiRequest('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Curso criado",
        description: "O curso foi criado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar curso.",
        variant: "destructive"
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => apiRequest(`/api/courses/${courseId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Curso excluído",
        description: "O curso foi excluído com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir curso.",
        variant: "destructive"
      });
    }
  });

  const handleCreateCourse = (formData: FormData) => {
    const courseData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      level: formData.get('level'),
      duration: formData.get('duration'),
      status: 'draft'
    };

    createCourseMutation.mutate(courseData);
  };

  const coursesList = Array.isArray(courses) ? courses : [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando cursos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administração de Cursos</h1>
            <p className="text-gray-600 mt-1">Gerencie os cursos da capacitação tecnológica</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Curso</DialogTitle>
                <DialogDescription>
                  Preencha as informações básicas do curso. Você poderá adicionar conteúdo depois.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleCreateCourse(formData);
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título do Curso</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Ex: Introdução ao Uso do Smartphone"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Descreva os objetivos e conteúdo do curso..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
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
                      <Select name="level" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante</SelectItem>
                          <SelectItem value="intermediario">Intermediário</SelectItem>
                          <SelectItem value="avancado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duração Estimada</Label>
                    <Input
                      id="duration"
                      name="duration"
                      placeholder="Ex: 4 horas"
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCourseMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createCourseMutation.isPending ? "Criando..." : "Criar Curso"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Cursos</p>
                  <p className="text-2xl font-bold text-gray-900">{coursesList.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Matrículas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {coursesList.reduce((sum, course) => sum + (course.enrolledCount || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {coursesList.length > 0 
                      ? Math.round(coursesList.reduce((sum, course) => sum + (course.completionRate || 0), 0) / coursesList.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {coursesList.filter(course => course.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>Cursos Criados</CardTitle>
            <CardDescription>
              Gerencie, edite e publique seus cursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coursesList.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso criado</h3>
                <p className="text-gray-600 mb-4">Comece criando seu primeiro curso de capacitação.</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {coursesList.map((course) => (
                  <div 
                    key={course.id} 
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                            {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{course.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.enrolledCount || 0} matriculados
                          </span>
                          <span>Duração: {course.duration}</span>
                          <span>Nível: {course.level}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/course-admin/${course.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCourseMutation.mutate(course.id)}
                          disabled={deleteCourseMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}