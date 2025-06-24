import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Filter,
  Search,
  CalendarDays,
  MapPin,
  Award,
  PlayCircle,
  UserPlus
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
}

export default function CourseEnrollment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch available courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: () => apiRequest('/api/courses')
  });

  // Fetch user's enrollments
  const { data: userEnrollments } = useQuery({
    queryKey: ['/api/user/enrollments'],
    queryFn: () => apiRequest('/api/user/enrollments'),
    enabled: !!user
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => 
      apiRequest(`/api/courses/${courseId}/enroll`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/enrollments'] });
      toast({
        title: "Inscrição realizada!",
        description: "Você foi inscrito no curso com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro na inscrição",
        description: "Não foi possível realizar a inscrição. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Filter courses
  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    const matchesType = typeFilter === 'all' || course.courseType === typeFilter;
    
    return matchesSearch && matchesCategory && matchesLevel && matchesType && course.status === 'published';
  }) || [];

  const isEnrolled = (courseId: string) => {
    return userEnrollments?.some((enrollment: any) => enrollment.courseId === courseId);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciante': return 'bg-green-100 text-green-800';
      case 'intermediario': return 'bg-yellow-100 text-yellow-800';
      case 'avancado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <PlayCircle className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      case 'hybrid': return <CalendarDays className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'online': return 'Online';
      case 'in_person': return 'Presencial';
      case 'hybrid': return 'Híbrido';
      default: return type;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Capacitação Tecnológica</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Desenvolva suas habilidades com nossos cursos especializados. 
            Inscreva-se e comece sua jornada de aprendizado hoje mesmo.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{courses?.length || 0}</div>
              <div className="text-sm text-gray-600">Cursos Disponíveis</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {courses?.reduce((sum: number, course: Course) => sum + course.enrolledCount, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Alunos Inscritos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {courses?.reduce((sum: number, course: Course) => sum + (course.duration || 0), 0) || 0}h
              </div>
              <div className="text-sm text-gray-600">Total de Horas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {courses?.filter((course: Course) => course.certificateEnabled).length || 0}
              </div>
              <div className="text-sm text-gray-600">Com Certificado</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <SelectItem value="all">Todas as Categorias</SelectItem>
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
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: Course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {course.coverImage ? (
                    <img 
                      src={course.coverImage} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-white" />
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getTypeIcon(course.courseType)}
                      <span>{getTypeLabel(course.courseType)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.enrolledCount} inscritos</span>
                    </div>
                    {course.certificateEnabled && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>Certificado</span>
                      </div>
                    )}
                  </div>

                  {course.startDate && (
                    <div className="text-sm text-gray-600 mb-4">
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
                    
                    {isEnrolled(course.id) ? (
                      <Badge variant="secondary" className="px-3 py-2">
                        Inscrito
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => enrollMutation.mutate(course.id)}
                        disabled={enrollMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCourses.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou aguarde novos cursos serem adicionados.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}