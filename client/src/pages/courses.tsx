import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { Clock, Users, BookOpen, Play, CheckCircle, UserPlus, CalendarDays, Search, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  courseType: string;
  status: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  maxEnrollments?: number;
  enrolledCount: number;
  completionRate: number;
  coverImage?: string;
  requirements?: string;
  learningObjectives?: string[];
  tags?: string[];
  certificateEnabled: boolean;
  isEnrolled?: boolean;
  progress?: number;
}

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch courses with enrollment status
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses/enrollments'],
    queryFn: () => apiRequest('/api/courses/enrollments', 'GET'),
  });

  // Fetch user certificates
  const { data: userCertificates = [] } = useQuery({
    queryKey: ['/api/users', user?.id, 'certificates'],
    queryFn: () => apiRequest(`/api/users/${user?.id}/certificates`, 'GET'),
    enabled: !!user?.id,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiRequest(`/api/courses/${courseId}/enroll`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/enrollments'] });
      toast({
        title: "Inscrição realizada!",
        description: "Você foi inscrito no curso com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na inscrição",
        description: error.message || "Não foi possível se inscrever no curso.",
        variant: "destructive",
      });
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(courses.map((course: Course) => course.category)));
  const levels = ['basico', 'intermediario', 'avancado'];
  const types = ['online', 'presencial', 'hibrido'];

  // Filter courses
  const filteredCourses = courses.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    const matchesType = typeFilter === 'all' || course.courseType === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enrolled' && course.isEnrolled) ||
      (statusFilter === 'available' && !course.isEnrolled);

    return matchesSearch && matchesCategory && matchesLevel && matchesType && matchesStatus;
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getLevelBadgeColor = (level: string) => {
    switch(level) {
      case 'basico': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediario': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avancado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch(type.toLowerCase()) {
      case 'online': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'presencial': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hibrido': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCourseType = (type: string | undefined) => {
    if (!type) return 'Online';
    switch(type.toLowerCase()) {
      case 'online': return 'Online';
      case 'presencial': return 'Presencial';
      case 'hibrido': return 'Híbrido';
      default: return 'Online';
    }
  };

  const formatLevel = (level: string | undefined) => {
    if (!level) return 'Básico';
    switch(level.toLowerCase()) {
      case 'basico': return 'Básico';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return 'Básico';
    }
  };

  // Separate enrolled and available courses
  const enrolledCourses = filteredCourses.filter((course: Course) => course.isEnrolled);
  const availableCourses = filteredCourses.filter((course: Course) => !course.isEnrolled);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Cursos de Capacitação</h1>
        </div>
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Filter className="h-5 w-5 text-gray-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Cursos</SelectItem>
                <SelectItem value="enrolled">Meus Cursos</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={`category-${index}`} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {formatLevel(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatCourseType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setLevelFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total de Cursos</p>
                  <p className="text-xl font-semibold">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Meus Cursos</p>
                  <p className="text-xl font-semibold">{enrolledCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Disponíveis</p>
                  <p className="text-xl font-semibold">{availableCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Enrolled Courses Section */}
            {enrolledCourses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Meus Cursos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course: Course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                          <Badge variant="secondary" className="ml-2">Inscrito</Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getLevelBadgeColor(course.level)}>
                            {formatLevel(course.level)}
                          </Badge>
                          <Badge variant="outline" className={getTypeBadgeColor(course.courseType)}>
                            {formatCourseType(course.courseType)}
                          </Badge>
                          <Badge variant="outline">{course.category}</Badge>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDuration(course.duration)}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrolledCount}
                          </div>
                        </div>

                        {course.progress !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full" 
                          onClick={() => {
                            if (course.progress === 100) {
                              navigate(`/courses/${course.id}/start`);
                            } else {
                              navigate(`/courses/${course.id}`);
                            }
                          }}
                        >
                          {course.progress === 100 ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ver Certificado
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continuar Curso
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses Section */}
            {availableCourses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  {enrolledCourses.length > 0 ? 'Cursos Disponíveis' : 'Todos os Cursos'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map((course: Course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getLevelBadgeColor(course.level)}>
                            {formatLevel(course.level)}
                          </Badge>
                          <Badge variant="outline" className={getTypeBadgeColor(course.courseType)}>
                            {formatCourseType(course.courseType)}
                          </Badge>
                          <Badge variant="outline">{course.category}</Badge>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDuration(course.duration)}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrolledCount}
                          </div>
                        </div>

                        {course.startDate && (
                          <div className="text-sm text-gray-600">
                            <CalendarDays className="h-4 w-4 inline mr-1" />
                            Início: {formatDate(course.startDate)}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/courses/${course.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              Ver Detalhes
                            </Button>
                          </Link>
                          
                          <Button
                            onClick={() => enrollMutation.mutate(course.id)}
                            disabled={enrollMutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredCourses.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
                <p className="text-gray-600">
                  {searchTerm || categoryFilter !== 'all' || levelFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Tente ajustar os filtros para encontrar cursos.' 
                    : 'Não há cursos disponíveis no momento.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}