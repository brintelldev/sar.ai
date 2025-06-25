import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Clock, Users, Award, Search, Play, CheckCircle } from "lucide-react";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
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
  enrolledCount: number;
  completionRate: number;
  isEnrolled?: boolean;
  progress?: number;
}

export default function CourseEnrollments() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses/enrollments'],
    queryFn: () => apiRequest('/api/courses/enrollments', 'GET'),
  });

  const filteredCourses = courses.filter((course: Course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrollInCourse = async (courseId: string) => {
    try {
      await apiRequest(`/api/courses/${courseId}/enroll`, 'POST');
      // Refresh courses data
      window.location.reload();
    } catch (error) {
      console.error('Erro ao se inscrever no curso:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };

  const getCourseTypeInfo = (courseType: string) => {
    switch (courseType) {
      case 'online':
        return { label: 'Online', color: 'bg-blue-100 text-blue-800', info: 'Acesso 24/7' };
      case 'presencial':
        return { label: 'Presencial', color: 'bg-green-100 text-green-800', info: 'Local físico' };
      case 'hibrido':
        return { label: 'Híbrido', color: 'bg-purple-100 text-purple-800', info: 'Online + Presencial' };
      default:
        return { label: 'Online', color: 'bg-blue-100 text-blue-800', info: 'Acesso 24/7' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cursos</h1>
        <p className="text-gray-600">
          Acesse os cursos de capacitação disponíveis para você
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
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

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso disponível'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tente ajustar os termos da busca.' 
                : 'Novos cursos estarão disponíveis em breve.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: Course) => {
            const typeInfo = getCourseTypeInfo(course.courseType);
            
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.enrolledCount} inscritos</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {typeInfo.info}
                  </div>

                  {course.isEnrolled ? (
                    <div className="space-y-3">
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
                      
                      <Button className="w-full" size="sm">
                        {course.progress === 100 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluído
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continuar Curso
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => enrollInCourse(course.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Inscrever-se
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}