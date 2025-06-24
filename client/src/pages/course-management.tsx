import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Calendar, 
  Clock,
  BookOpen,
  Award,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useBeneficiaries, useVolunteers } from '@/hooks/use-organization';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  courseType: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxEnrollments?: number;
}

interface Enrollment {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  status: string;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  finalScore?: number;
  certificateIssued: boolean;
  notes?: string;
}

interface Instructor {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  role: string;
  assignedAt: string;
}

export default function CourseManagement() {
  const { courseId } = useParams();
  const { toast } = useToast();
  const { data: beneficiaries } = useBeneficiaries();
  const { data: volunteers } = useVolunteers();
  
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Fetch enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'enrollments'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/enrollments`),
    enabled: !!courseId
  });

  // Fetch instructors
  const { data: instructors, isLoading: instructorsLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'instructors'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/instructors`),
    enabled: !!courseId
  });

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: (data: { beneficiaryId: string; status: string }) => 
      apiRequest(`/api/courses/${courseId}/enrollments`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'enrollments'] });
      setIsEnrollDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Beneficiário inscrito no curso com sucesso!"
      });
    }
  });

  const assignInstructorMutation = useMutation({
    mutationFn: (data: { volunteerId: string; role: string }) => 
      apiRequest(`/api/courses/${courseId}/instructors`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'instructors'] });
      setIsInstructorDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Instrutor atribuído ao curso com sucesso!"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { enrollmentId: string; status: string; notes?: string }) => 
      apiRequest(`/api/enrollments/${data.enrollmentId}/status`, 'PATCH', { status: data.status, notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'enrollments'] });
      toast({
        title: "Status atualizado",
        description: "Status do aluno atualizado com sucesso!"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enrolled': return 'Inscrito';
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'dropped': return 'Desistente';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  if (courseLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
            <Button onClick={() => window.history.back()}>Voltar</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-blue-100 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{course.courseType === 'online' ? 'Online' : course.courseType === 'in_person' ? 'Presencial' : 'Híbrido'}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {course.level}
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                  <p className="text-sm text-gray-600">Inscritos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {enrollments?.filter(e => e.status === 'active').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {enrollments?.filter(e => e.status === 'completed').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{instructors?.length || 0}</p>
                  <p className="text-sm text-gray-600">Instrutores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="enrollments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="enrollments">Inscrições</TabsTrigger>
            <TabsTrigger value="instructors">Instrutores</TabsTrigger>
            {course.courseType === 'in_person' && (
              <TabsTrigger value="attendance">Frequência</TabsTrigger>
            )}
            {course.courseType === 'online' && (
              <TabsTrigger value="progress">Progresso</TabsTrigger>
            )}
          </TabsList>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Beneficiários Inscritos</CardTitle>
                <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Inscrever Beneficiário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inscrever Beneficiário no Curso</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      enrollMutation.mutate({
                        beneficiaryId: formData.get('beneficiaryId') as string,
                        status: formData.get('status') as string
                      });
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="beneficiaryId">Beneficiário</Label>
                        <Select name="beneficiaryId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um beneficiário" />
                          </SelectTrigger>
                          <SelectContent>
                            {beneficiaries?.map((beneficiary: any) => (
                              <SelectItem key={beneficiary.id} value={beneficiary.id}>
                                {beneficiary.personalInfo?.name || beneficiary.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status Inicial</Label>
                        <Select name="status" defaultValue="enrolled">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrolled">Inscrito</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={enrollMutation.isPending}>
                        {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Inscrição</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments?.map((enrollment: Enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{enrollment.beneficiaryName}</div>
                              <div className="text-sm text-gray-600">{enrollment.beneficiaryEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(enrollment.status)}>
                              {getStatusLabel(enrollment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                          <TableCell>
                            {enrollment.finalScore ? `${enrollment.finalScore}%` : 'Em andamento'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {enrollment.status === 'enrolled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    enrollmentId: enrollment.id,
                                    status: 'active'
                                  })}
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Ativar
                                </Button>
                              )}
                              {enrollment.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    enrollmentId: enrollment.id,
                                    status: 'completed'
                                  })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Concluir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructors Tab */}
          <TabsContent value="instructors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Instrutores do Curso</CardTitle>
                <Dialog open={isInstructorDialogOpen} onOpenChange={setIsInstructorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Atribuir Instrutor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Atribuir Instrutor ao Curso</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      assignInstructorMutation.mutate({
                        volunteerId: formData.get('volunteerId') as string,
                        role: formData.get('role') as string
                      });
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="volunteerId">Voluntário</Label>
                        <Select name="volunteerId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um voluntário" />
                          </SelectTrigger>
                          <SelectContent>
                            {volunteers?.map((volunteer: any) => (
                              <SelectItem key={volunteer.id} value={volunteer.id}>
                                {volunteer.personalInfo?.name || volunteer.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="role">Função</Label>
                        <Select name="role" defaultValue="instructor">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instructor">Instrutor Principal</SelectItem>
                            <SelectItem value="assistant">Instrutor Assistente</SelectItem>
                            <SelectItem value="coordinator">Coordenador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={assignInstructorMutation.isPending}>
                        {assignInstructorMutation.isPending ? 'Atribuindo...' : 'Atribuir'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {instructorsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instrutor</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Data de Atribuição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instructors?.map((instructor: Instructor) => (
                        <TableRow key={instructor.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{instructor.volunteerName}</div>
                              <div className="text-sm text-gray-600">{instructor.volunteerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {instructor.role === 'instructor' ? 'Instrutor Principal' :
                               instructor.role === 'assistant' ? 'Instrutor Assistente' : 'Coordenador'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(instructor.assignedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab (for in-person courses) */}
          {course.courseType === 'in_person' && (
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Controle de Frequência</h3>
                    <p className="text-gray-600 mb-4">
                      Para cursos presenciais, os instrutores podem marcar a presença dos alunos em cada sessão.
                    </p>
                    <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                      Marcar Presença
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Progress Tab (for online courses) */}
          {course.courseType === 'online' && (
            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso dos Módulos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Acompanhamento Online</h3>
                    <p className="text-gray-600">
                      Para cursos online, o progresso é rastreado automaticamente conforme os alunos acessam os módulos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}