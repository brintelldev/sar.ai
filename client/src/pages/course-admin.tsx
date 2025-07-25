import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
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
import { CategoryCombobox } from "@/components/CategoryCombobox";
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
  BarChart3,
  Power,
  PowerOff,
  MoreVertical
} from "lucide-react";
import { CourseActionsModal } from "@/components/course/course-actions-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CourseSearch } from "@/components/course/course-search";

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
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedAction, setSelectedAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isVolunteer = userRole === 'volunteer';

  const openActionModal = (course: Course, action: 'delete' | 'deactivate' | 'activate') => {
    setSelectedCourse(course);
    setSelectedAction(action);
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setSelectedCourse(null);
    setSelectedAction(null);
    setActionModalOpen(false);
  };

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['/api/courses/admin'],
    queryFn: () => apiRequest('/api/courses/admin'),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  console.log("Courses query result:", { courses, isLoading, error });

  const createCourseMutation = useMutation({
    mutationFn: (courseData: any) => apiRequest('/api/courses', 'POST', courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/admin'] });
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



  const handleCreateCourse = (formData: FormData) => {
    const courseData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: selectedCategory,
      level: formData.get('level') as string,
      courseType: formData.get('courseType') as string,
      duration: parseInt(formData.get('duration') as string),
      status: 'draft'
    };

    console.log("Creating course:", courseData);
    createCourseMutation.mutate(courseData, {
      onSuccess: () => {
        setSelectedCategory("");
        setIsCreateDialogOpen(false);
      }
    });
  };

  const coursesList = Array.isArray(courses) ? courses : [];

  // Filter courses based on search term
  const filteredCourses = coursesList.filter((course: Course) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term) ||
      course.category.toLowerCase().includes(term)
    );
  });

  console.log("Processed courses list:", coursesList);

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

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Erro ao carregar cursos: {error.message}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {isVolunteer ? "Meus Cursos como Instrutor" : "Administração de Cursos"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isVolunteer 
                ? "Gerencie os cursos onde você é instrutor"
                : "Gerencie os cursos da capacitação tecnológica"
              }
            </p>
          </div>
          
          {!isVolunteer && (
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
                      <CategoryCombobox
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="Selecione ou digite uma categoria"
                      />
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="courseType">Tipo de Curso</Label>
                      <Select name="courseType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online (EAD)</SelectItem>
                          <SelectItem value="in_person">Presencial</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duração (horas)</Label>
                      <Input
                        id="duration"
                        name="duration"
                        type="number"
                        placeholder="Ex: 25"
                        required
                      />
                    </div>
                  </div>
                  

                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedCategory("");
                  }}>
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
          )}
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

        {/* Search Section */}
        {coursesList.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border">
            <div className="flex-1 max-w-md">
              <CourseSearch
                courses={coursesList}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Buscar cursos por título, descrição ou categoria..."
              />
            </div>
            <div className="text-sm text-gray-600">
              {searchTerm ? `${filteredCourses.length} de ${coursesList.length} cursos` : `${coursesList.length} cursos`}
            </div>
          </div>
        )}

        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isVolunteer ? "Meus Cursos como Instrutor" : "Cursos Criados"}
            </CardTitle>
            <CardDescription>
              {isVolunteer 
                ? "Cursos onde você foi atribuído como instrutor"
                : "Gerencie, edite e publique seus cursos"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coursesList.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isVolunteer 
                    ? "Nenhum curso atribuído" 
                    : "Nenhum curso criado"
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {isVolunteer 
                    ? "Você ainda não foi atribuído como instrutor em nenhum curso. Entre em contato com um administrador para ser atribuído a cursos."
                    : "Comece criando seu primeiro curso de capacitação."
                  }
                </p>
                {!isVolunteer && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Curso
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.length === 0 && searchTerm ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Nenhum curso encontrado para "{searchTerm}"
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                      className="mt-2"
                    >
                      Limpar busca
                    </Button>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
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
                            <span>Duração: {Math.round((course.duration || 60) / 60)}h</span>
                            <span>Nível: {course.level}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/course-admin/${course.id}`)}
                            title="Editar informações do curso e gerenciar módulos"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar Curso
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/courses/${course.id}`)}
                            title="Ver como o curso aparece para os beneficiários"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Visualizar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {course.status === 'published' ? (
                                <DropdownMenuItem
                                  onClick={() => openActionModal(course, 'deactivate')}
                                  className="text-orange-600"
                                >
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Desativar Curso
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => openActionModal(course, 'activate')}
                                  className="text-green-600"
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  Ativar Curso
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => openActionModal(course, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Permanentemente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Actions Modal */}
        <CourseActionsModal
          course={selectedCourse}
          action={selectedAction}
          isOpen={actionModalOpen}
          onClose={closeActionModal}
        />
      </div>
    </MainLayout>
  );
}