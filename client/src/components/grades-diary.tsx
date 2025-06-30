import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, BookOpen, TrendingUp } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
}

interface Grade {
  id: string;
  userId: string;
  courseId: string;
  gradeScale: number;
  feedback?: string;
  passed: boolean;
  gradedAt: string;
}

interface GradesDiaryProps {
  courseId: string;
}

export function GradesDiary({ courseId }: GradesDiaryProps) {
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [gradeValues, setGradeValues] = useState<Record<string, { grade: string; feedback: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar estudantes inscritos no curso
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'students'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/students`),
    enabled: !!courseId
  });

  // Buscar notas existentes
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'grades'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/grades`),
    enabled: !!courseId
  });

  // Mutation para salvar nota
  const saveGradeMutation = useMutation({
    mutationFn: (gradeData: any) => 
      apiRequest(`/api/courses/${courseId}/grades`, 'POST', gradeData),
    onSuccess: () => {
      toast({
        title: "Nota salva!",
        description: "A nota foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'grades'] });
      setEditingGrade(null);
      setGradeValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar nota",
        description: error.message || "Não foi possível salvar a nota.",
        variant: "destructive",
      });
    }
  });

  const handleGradeEdit = (studentId: string) => {
    setEditingGrade(studentId);
    const existingGrade = grades?.find((g: Grade) => g.userId === studentId);
    if (existingGrade) {
      setGradeValues({
        [studentId]: {
          grade: existingGrade.gradeScale.toString(),
          feedback: existingGrade.feedback || ''
        }
      });
    }
  };

  const handleGradeSave = (studentId: string) => {
    const values = gradeValues[studentId];
    if (!values || !values.grade) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma nota válida.",
        variant: "destructive",
      });
      return;
    }

    const grade = parseFloat(values.grade);
    if (grade < 0 || grade > 10) {
      toast({
        title: "Erro",
        description: "A nota deve estar entre 0 e 10.",
        variant: "destructive",
      });
      return;
    }

    saveGradeMutation.mutate({
      userId: studentId,
      gradeScale: grade,
      feedback: values.feedback,
      passed: grade >= 7,
      gradeType: 'course'
    });
  };

  if (studentsLoading || gradesLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!students || students.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum aluno inscrito
          </h3>
          <p className="text-gray-600 mb-4">
            Não há alunos inscritos neste curso presencial ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStudentGrade = (studentId: string) => {
    return grades?.find((g: Grade) => g.userId === studentId);
  };

  const calculateClassAverage = () => {
    const validGrades = grades?.filter((g: Grade) => g.gradeScale > 0);
    if (!validGrades || validGrades.length === 0) return 0;
    const sum = validGrades.reduce((acc: number, g: Grade) => acc + g.gradeScale, 0);
    return (sum / validGrades.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média da Turma</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateClassAverage()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades?.filter((g: Grade) => g.passed).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Diário de Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comentários</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: Student) => {
                const grade = getStudentGrade(student.id);
                const isEditing = editingGrade === student.id;

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={gradeValues[student.id]?.grade || ''}
                          onChange={(e) => setGradeValues(prev => ({
                            ...prev,
                            [student.id]: {
                              ...prev[student.id],
                              grade: e.target.value
                            }
                          }))}
                          className="w-20"
                          placeholder="0.0"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {grade ? grade.gradeScale.toFixed(1) : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {grade ? (
                        <Badge 
                          variant={grade.passed ? "default" : "destructive"}
                        >
                          {grade.passed ? "Aprovado" : "Reprovado"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={gradeValues[student.id]?.feedback || ''}
                          onChange={(e) => setGradeValues(prev => ({
                            ...prev,
                            [student.id]: {
                              ...prev[student.id],
                              feedback: e.target.value
                            }
                          }))}
                          placeholder="Comentários sobre o desempenho..."
                          className="min-h-[60px]"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {grade?.feedback || 'Sem comentários'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleGradeSave(student.id)}
                            disabled={saveGradeMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingGrade(null);
                              setGradeValues({});
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGradeEdit(student.id)}
                        >
                          {grade ? "Editar" : "Avaliar"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}