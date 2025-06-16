import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Filter, BookOpen, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  coverImage?: string;
  status: string;
  passScore: number;
  certificateEnabled: boolean;
  createdAt: string;
}

interface UserCourseProgress {
  id: string;
  courseId: string;
  status: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [levelFilter, setLevelFilter] = useState("todos");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: () => apiRequest('/api/courses')
  });

  const { data: progressData } = useQuery({
    queryKey: ['/api/courses/progress'],
    queryFn: () => apiRequest('/api/courses/progress')
  });

  const courses = Array.isArray(coursesData) ? coursesData : [];
  const userProgress = Array.isArray(progressData) ? progressData : [];

  const startCourseMutation = useMutation({
    mutationFn: (courseId: string) => apiRequest(`/api/courses/${courseId}/start`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/progress'] });
      toast({
        title: "Sucesso",
        description: "Curso iniciado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao iniciar o curso",
        variant: "destructive",
      });
    }
  });

  const filteredCourses = courses.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || course.category === categoryFilter;
    const matchesLevel = levelFilter === "todos" || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getUserProgress = (courseId: string) => {
    return userProgress.find((p: UserCourseProgress) => p.courseId === courseId);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciante': return 'bg-green-100 text-green-800';
      case 'intermediario': return 'bg-yellow-100 text-yellow-800';
      case 'avancado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tecnologia': return '💻';
      case 'empreendedorismo': return '🚀';
      case 'direitos': return '⚖️';
      case 'saude': return '🏥';
      default: return '📚';
    }
  };

  const getStatusBadge = (progress: UserCourseProgress | undefined) => {
    if (!progress) {
      return <Badge variant="outline">Não iniciado</Badge>;
    }
    
    switch (progress.status) {
      case 'in_progress':
        return <Badge variant="default">Em progresso</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Reprovado</Badge>;
      default:
        return <Badge variant="outline">Não iniciado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando cursos...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Capacitação Tecnológica</h1>
            <p className="mt-2 text-gray-600">
              Desenvolva suas habilidades com nossos cursos especializados
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              <SelectItem value="tecnologia">Tecnologia</SelectItem>
              <SelectItem value="empreendedorismo">Empreendedorismo</SelectItem>
              <SelectItem value="direitos">Direitos</SelectItem>
              <SelectItem value="saude">Saúde</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              <SelectItem value="iniciante">Iniciante</SelectItem>
              <SelectItem value="intermediario">Intermediário</SelectItem>
              <SelectItem value="avancado">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-gray-600">Cursos disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{userProgress.filter((p: UserCourseProgress) => p.status === 'in_progress').length}</p>
                <p className="text-gray-600">Em progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{userProgress.filter((p: UserCourseProgress) => p.status === 'completed').length}</p>
                <p className="text-gray-600">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {Math.round(courses.reduce((acc: number, course: Course) => acc + ((course.duration || 60) / 60), 0))}h
                </p>
                <p className="text-gray-600">Total de horas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course: Course) => {
          const progress = getUserProgress(course.id);
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">{getCategoryIcon(course.category)}</span>
                  {getStatusBadge(progress)}
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {course.category}
                  </Badge>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{Math.round((course.duration || 60) / 60)}h de duração</span>
                </div>

                {progress && progress.status === 'in_progress' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                {!progress || progress.status === 'not_started' ? (
                  <Button 
                    onClick={() => startCourseMutation.mutate(course.id)}
                    disabled={startCourseMutation.isPending}
                    className="flex-1"
                  >
                    {startCourseMutation.isPending ? 'Iniciando...' : 'Iniciar Curso'}
                  </Button>
                ) : (
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button className="w-full">
                      {progress.status === 'completed' ? 'Revisar' : 'Continuar'}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum curso encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros de busca ou aguarde novos cursos serem adicionados.
          </p>
        </div>
      )}
    </div>
    </MainLayout>
  );
}