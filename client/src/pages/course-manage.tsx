import { useState } from "react";
import { useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, UserPlus, UserMinus, GraduationCap, BookOpen, ClipboardList, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { GradesDiary } from "@/components/grades-diary";
import { AttendanceDiary } from "@/components/attendance-diary";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  position: string;
  createdAt: string;
}

interface UserCourseRole {
  id: string;
  userId: string;
  courseId: string;
  role: string;
  permissions: any;
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
  notes: string;
  user: User;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  status: string;
}

export function CourseManage() {
  const { courseId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState("students");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    userId: "",
    role: "",
    notes: ""
  });

  // Get course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Get course enrollments (all roles)
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<UserCourseRole[]>({
    queryKey: ['/api/courses', courseId, 'enrollments'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/enrollments`),
    enabled: !!courseId
  });

  // Get available users for assignment based on role
  const { data: availableUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users', assignmentData.role],
    queryFn: () => {
      if (assignmentData.role === 'instructor' || assignmentData.role === 'assistant') {
        return apiRequest('/api/volunteers/users');
      } else if (assignmentData.role === 'student') {
        return apiRequest('/api/beneficiaries/users');
      } else {
        return apiRequest('/api/users');
      }
    },
    enabled: isAssignDialogOpen && !!assignmentData.role
  });

  // Assign user to course mutation
  const assignUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${courseId}/assign`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário atribuído ao curso com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'enrollments'] });
      // Invalidate user courses to sync with user's course list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/enrollments'] });
      setIsAssignDialogOpen(false);
      setAssignmentData({ userId: "", role: "", notes: "" });
      setSearchTerm("");
      setUserComboboxOpen(false);
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao atribuir usuário ao curso.";
      
      // Check if it's a duplicate assignment error
      if (error.message && error.message.includes('409')) {
        errorMessage = "Este usuário já está atribuído ao curso. A função foi atualizada.";
        // Refresh data to show the updated role
        queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'enrollments'] });
        setIsAssignDialogOpen(false);
        setAssignmentData({ userId: "", role: "", notes: "" });
        setSearchTerm("");
        setUserComboboxOpen(false);
        
        toast({
          title: "Usuário já Atribuído",
          description: errorMessage,
          variant: "default"
        });
        return;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Remove user from course mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest(`/api/courses/${courseId}/users/${userId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário removido do curso com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'enrollments'] });
      // Invalidate user courses to sync with user's course list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/enrollments'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover usuário do curso.",
        variant: "destructive"
      });
    }
  });

  const handleAssignUser = () => {
    if (!assignmentData.userId || !assignmentData.role) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um usuário e uma função.",
        variant: "destructive"
      });
      return;
    }

    assignUserMutation.mutate({
      userId: assignmentData.userId,
      role: assignmentData.role,
      notes: assignmentData.notes,
      assignedBy: user?.id
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm("Tem certeza que deseja remover este usuário do curso?")) {
      removeUserMutation.mutate(userId);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'instructor':
        return 'bg-green-100 text-green-800';
      case 'assistant':
        return 'bg-yellow-100 text-yellow-800';
      case 'observer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return 'Aluno';
      case 'instructor':
        return 'Instrutor';
      case 'assistant':
        return 'Assistente';
      case 'observer':
        return 'Observador';
      default:
        return role;
    }
  };

  const students = enrollments?.filter(e => e.role === 'student') || [];
  const instructors = enrollments?.filter(e => e.role === 'instructor') || [];
  const assistants = enrollments?.filter(e => e.role === 'assistant') || [];
  const observers = enrollments?.filter(e => e.role === 'observer') || [];

  if (courseLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando curso...</div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Curso não encontrado</h2>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
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
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Inscrições</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instrutores</p>
                <p className="text-2xl font-bold">{instructors.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assistentes</p>
                <p className="text-2xl font-bold">{assistants.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-yellow-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Participantes do Curso</h2>
          <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
            setIsAssignDialogOpen(open);
            if (!open) {
              setAssignmentData({ userId: "", role: "", notes: "" });
              setSearchTerm("");
              setUserComboboxOpen(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Participante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Participante ao Curso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={assignmentData.role} onValueChange={(value) => 
                    setAssignmentData(prev => ({ ...prev, role: value, userId: "" }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função primeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Aluno (Beneficiários)</SelectItem>
                      <SelectItem value="instructor">Instrutor (Voluntários)</SelectItem>
                      <SelectItem value="assistant">Assistente (Voluntários)</SelectItem>
                      <SelectItem value="observer">Observador (Todos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assignmentData.role && (
                  <div className="space-y-2">
                    <Label htmlFor="user">
                      {assignmentData.role === 'student' ? "Selecionar Beneficiário" :
                       assignmentData.role === 'instructor' || assignmentData.role === 'assistant' ? "Selecionar Voluntário" :
                       "Selecionar Usuário"}
                    </Label>
                    <Popover open={userComboboxOpen} onOpenChange={setUserComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={userComboboxOpen}
                          className="w-full justify-between"
                          disabled={usersLoading}
                        >
                          {assignmentData.userId 
                            ? availableUsers?.find(user => user.id === assignmentData.userId)?.name
                            : usersLoading 
                              ? "Carregando usuários..." 
                              : assignmentData.role === 'student' 
                                ? "Buscar e selecionar beneficiário..." 
                                : assignmentData.role === 'instructor' || assignmentData.role === 'assistant'
                                  ? "Buscar e selecionar voluntário..."
                                  : "Buscar e selecionar usuário..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder={
                              assignmentData.role === 'student' ? "Buscar beneficiário..." :
                              assignmentData.role === 'instructor' || assignmentData.role === 'assistant' ? "Buscar voluntário..." :
                              "Buscar usuário..."
                            }
                          />
                          <CommandEmpty>
                            {usersLoading ? "Carregando..." : "Nenhum usuário encontrado."}
                          </CommandEmpty>
                          <CommandGroup>
                            {availableUsers?.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.name + " " + user.email}
                                onSelect={() => {
                                  setAssignmentData(prev => ({ ...prev, userId: user.id }));
                                  setUserComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    assignmentData.userId === user.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações sobre esta atribuição..."
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAssignUser} disabled={assignUserMutation.isPending}>
                    {assignUserMutation.isPending ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="students">Alunos ({students.length})</TabsTrigger>
            <TabsTrigger value="instructors">Instrutores ({instructors.length})</TabsTrigger>
            <TabsTrigger value="assistants">Assistentes ({assistants.length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({enrollments?.length || 0})</TabsTrigger>
            <TabsTrigger value="grades">
              <FileText className="h-4 w-4 mr-1" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <ClipboardList className="h-4 w-4 mr-1" />
              Frequência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {enrollmentsLoading ? (
              <div className="text-center py-8">Carregando alunos...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno inscrito no curso
              </div>
            ) : (
              <div className="grid gap-4">
                {students.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{enrollment.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Inscrito em: {new Date(enrollment.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(enrollment.role)}>
                          {getRoleLabel(enrollment.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(enrollment.userId)}
                          disabled={removeUserMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instructors" className="space-y-4">
            {enrollmentsLoading ? (
              <div className="text-center py-8">Carregando instrutores...</div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum instrutor atribuído ao curso
              </div>
            ) : (
              <div className="grid gap-4">
                {instructors.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{enrollment.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Atribuído em: {new Date(enrollment.assignedAt).toLocaleDateString()}
                          </p>
                          {enrollment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obs: {enrollment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(enrollment.role)}>
                          {getRoleLabel(enrollment.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(enrollment.userId)}
                          disabled={removeUserMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assistants" className="space-y-4">
            {enrollmentsLoading ? (
              <div className="text-center py-8">Carregando assistentes...</div>
            ) : assistants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum assistente atribuído ao curso
              </div>
            ) : (
              <div className="grid gap-4">
                {assistants.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{enrollment.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Atribuído em: {new Date(enrollment.assignedAt).toLocaleDateString()}
                          </p>
                          {enrollment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obs: {enrollment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(enrollment.role)}>
                          {getRoleLabel(enrollment.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(enrollment.userId)}
                          disabled={removeUserMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {enrollmentsLoading ? (
              <div className="text-center py-8">Carregando participantes...</div>
            ) : !enrollments || enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum participante inscrito no curso
              </div>
            ) : (
              <div className="grid gap-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          enrollment.role === 'student' ? 'bg-blue-100' :
                          enrollment.role === 'instructor' ? 'bg-green-100' :
                          enrollment.role === 'assistant' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {enrollment.role === 'instructor' ? (
                            <GraduationCap className={`h-5 w-5 ${
                              enrollment.role === 'student' ? 'text-blue-600' :
                              enrollment.role === 'instructor' ? 'text-green-600' :
                              enrollment.role === 'assistant' ? 'text-yellow-600' : 'text-gray-600'
                            }`} />
                          ) : (
                            <Users className={`h-5 w-5 ${
                              enrollment.role === 'student' ? 'text-blue-600' :
                              enrollment.role === 'instructor' ? 'text-green-600' :
                              enrollment.role === 'assistant' ? 'text-yellow-600' : 'text-gray-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{enrollment.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{enrollment.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.role === 'student' ? 'Inscrito' : 'Atribuído'} em: {new Date(enrollment.assignedAt).toLocaleDateString()}
                          </p>
                          {enrollment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obs: {enrollment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(enrollment.role)}>
                          {getRoleLabel(enrollment.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(enrollment.userId)}
                          disabled={removeUserMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Diário de Notas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie as notas dos alunos inscritos no curso
                </p>
              </CardHeader>
              <CardContent>
                <GradesDiary courseId={courseId!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Diário de Frequência
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Controle a frequência dos alunos nas aulas presenciais
                </p>
              </CardHeader>
              <CardContent>
                <AttendanceDiary courseId={courseId!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}