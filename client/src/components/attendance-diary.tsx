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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Save, 
  UserCheck, 
  Clock, 
  Users,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Student {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  sessionDate: string;
  sessionTitle: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused';
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedAt: string;
}

interface AttendanceDiaryProps {
  courseId: string;
}

export function AttendanceDiary({ courseId }: AttendanceDiaryProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessionTitle, setSessionTitle] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: string;
    arrivalTime: string;
    departureTime: string;
    notes: string;
  }>>({});
  const [showNewSession, setShowNewSession] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar estudantes inscritos no curso
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'students'],
    queryFn: () => apiRequest(`/api/courses/${courseId}/students`),
    enabled: !!courseId
  });

  // Buscar registros de presença para a data selecionada
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/courses', courseId, 'attendance', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => apiRequest(`/api/courses/${courseId}/attendance?date=${format(selectedDate, 'yyyy-MM-dd')}`),
    enabled: !!courseId && !!selectedDate
  });

  // Mutation para salvar presença
  const saveAttendanceMutation = useMutation({
    mutationFn: (attendanceData: any) => 
      apiRequest(`/api/courses/${courseId}/attendance`, 'POST', attendanceData),
    onSuccess: () => {
      toast({
        title: "Presença salva!",
        description: "Os registros de presença foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/courses', courseId, 'attendance', format(selectedDate, 'yyyy-MM-dd')] 
      });
      setAttendanceData({});
      setShowNewSession(false);
      setSessionTitle('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar presença",
        description: error.message || "Não foi possível salvar os registros de presença.",
        variant: "destructive",
      });
    }
  });

  const handleSaveAttendance = () => {
    if (!sessionTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para a aula.",
        variant: "destructive",
      });
      return;
    }

    const attendancePayload = students?.map((student: Student) => {
      const data = attendanceData[student.id];
      return {
        userId: student.id, // Usando o ID do usuário estudante
        sessionDate: format(selectedDate, 'yyyy-MM-dd'),
        sessionTitle,
        attendanceStatus: data?.status || 'absent',
        arrivalTime: data?.arrivalTime || null,
        departureTime: data?.departureTime || null,
        notes: data?.notes || null
      };
    }) || [];

    saveAttendanceMutation.mutate({
      sessionDate: format(selectedDate, 'yyyy-MM-dd'),
      sessionTitle,
      attendanceRecords: attendancePayload
    });
  };

  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords?.find((record: AttendanceRecord) => record.userId === studentId);
  };

  const getAttendanceStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return { present: 0, absent: 0, late: 0, excused: 0 };
    
    const stats = attendanceRecords.reduce((acc: any, record: AttendanceRecord) => {
      acc[record.attendanceStatus] = (acc[record.attendanceStatus] || 0) + 1;
      return acc;
    }, {});

    return {
      present: stats.present || 0,
      absent: stats.absent || 0,
      late: stats.late || 0,
      excused: stats.excused || 0
    };
  };

  if (studentsLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!students || students.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Date Selection and New Session */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Data da Aula:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={() => setShowNewSession(true)}
          disabled={showNewSession}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula
        </Button>
      </div>

      {/* Statistics */}
      {attendanceRecords && attendanceRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Justificados</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Session Form */}
      {showNewSession && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Aula - {format(selectedDate, "PPP", { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTitle">Título da Aula</Label>
              <Input
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Ex: Aula 1 - Introdução ao Empreendedorismo"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chegada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.registrationNumber}</TableCell>
                    <TableCell>
                      <Select
                        value={attendanceData[student.id]?.status || ''}
                        onValueChange={(value) => setAttendanceData(prev => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            status: value
                          }
                        }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Presente</SelectItem>
                          <SelectItem value="absent">Ausente</SelectItem>
                          <SelectItem value="late">Atrasado</SelectItem>
                          <SelectItem value="excused">Justificado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={attendanceData[student.id]?.arrivalTime || ''}
                        onChange={(e) => setAttendanceData(prev => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            arrivalTime: e.target.value
                          }
                        }))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={attendanceData[student.id]?.departureTime || ''}
                        onChange={(e) => setAttendanceData(prev => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            departureTime: e.target.value
                          }
                        }))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={attendanceData[student.id]?.notes || ''}
                        onChange={(e) => setAttendanceData(prev => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            notes: e.target.value
                          }
                        }))}
                        placeholder="Observações..."
                        className="w-32"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveAttendance}
                disabled={saveAttendanceMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Presença
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewSession(false);
                  setSessionTitle('');
                  setAttendanceData({});
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Attendance Records */}
      {attendanceRecords && attendanceRecords.length > 0 && !showNewSession && (
        <Card>
          <CardHeader>
            <CardTitle>
              Presença - {format(selectedDate, "PPP", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chegada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => {
                  const attendance = getStudentAttendance(student.id);
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        {attendance ? (
                          <Badge 
                            variant={
                              attendance.attendanceStatus === 'present' ? 'default' :
                              attendance.attendanceStatus === 'late' ? 'secondary' :
                              attendance.attendanceStatus === 'excused' ? 'outline' :
                              'destructive'
                            }
                          >
                            {attendance.attendanceStatus === 'present' ? 'Presente' :
                             attendance.attendanceStatus === 'late' ? 'Atrasado' :
                             attendance.attendanceStatus === 'excused' ? 'Justificado' :
                             'Ausente'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Não registrado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendance?.arrivalTime || '-'}
                      </TableCell>
                      <TableCell>
                        {attendance?.departureTime || '-'}
                      </TableCell>
                      <TableCell>
                        {attendance?.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {attendanceLoading && (
        <div className="text-center py-8">Carregando registros de presença...</div>
      )}

      {!attendanceLoading && (!attendanceRecords || attendanceRecords.length === 0) && !showNewSession && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma aula registrada
            </h3>
            <p className="text-gray-600 mb-4">
              Não há registros de presença para {format(selectedDate, "PPP", { locale: ptBR })}.
            </p>
            <Button onClick={() => setShowNewSession(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Nova Aula
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}