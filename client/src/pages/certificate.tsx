import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { CertificateGenerator } from "@/components/certificate/certificate-generator";
import { useToast } from "@/hooks/use-toast";

export default function CertificatePage() {
  const [, params] = useRoute("/courses/:id/certificate");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const courseId = params?.id;

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Check if user has completed the course
  const { data: userProgress } = useQuery({
    queryKey: ['/api/courses', courseId, 'user-progress'],
    queryFn: () => {
      // Simulate user progress - in production this would come from the API
      const savedProgress = localStorage.getItem(`course-progress-${courseId}`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        return progress;
      }
      return { progress: 100, status: 'completed', completedAt: new Date().toISOString() };
    },
    enabled: !!courseId
  });

  const handleCertificateGenerated = () => {
    toast({
      title: "Certificado gerado com sucesso!",
      description: "Seu certificado foi baixado e salvo no seu dispositivo.",
    });
  };

  if (courseLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Carregando curso...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Curso não encontrado</h2>
              <p className="text-gray-600 mb-6">
                O curso que você está procurando não foi encontrado ou você não tem acesso a ele.
              </p>
              <Button onClick={() => navigate('/courses')}>
                Voltar aos Cursos
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Check if user has completed the course
  if (!userProgress || userProgress.progress < 100) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="text-center py-12 border-yellow-200 bg-yellow-50">
            <CardContent>
              <Award className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-800 mb-4">
                Curso ainda não concluído
              </h2>
              <p className="text-yellow-700 mb-6">
                Você precisa completar 100% do curso para gerar seu certificado.
                Progresso atual: {userProgress?.progress || 0}%
              </p>
              <div className="space-x-4">
                <Button 
                  onClick={() => navigate(`/courses/${courseId}/progress`)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Continuar Curso
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/courses')}
                >
                  Voltar aos Cursos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const certificateData = {
    studentName: "Usuário Exemplo", // Em produção, viria dos dados do usuário autenticado
    courseName: course.title,
    organizationName: "Instituto Esperança", // Em produção, viria da organização atual
    completionDate: userProgress.completedAt || new Date().toISOString(),
    duration: Math.round((course.duration || 0) / 60),
    certificateId: `CERT-${course.id.slice(0, 8).toUpperCase()}`,
    instructorName: "Equipe de Capacitação"
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/courses/${courseId}/progress`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Progresso</span>
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Award className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-blue-800">
              Certificado de Conclusão
            </CardTitle>
            <CardDescription className="text-lg text-blue-700">
              Parabéns por concluir o curso "{course.title}"!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Certificate Generator */}
        <CertificateGenerator 
          certificateData={certificateData}
          onGenerate={handleCertificateGenerated}
        />

        {/* Course Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Resumo do Curso Concluído</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categoria:</span>
                    <span className="font-medium">{course.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nível:</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duração:</span>
                    <span className="font-medium">{Math.round((course.duration || 0) / 60)}h</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Status de Conclusão</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Progresso:</span>
                    <span className="font-bold text-green-800">100% Concluído</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Data de Conclusão:</span>
                    <span className="font-medium text-green-800">
                      {new Date(userProgress.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Certificado:</span>
                    <span className="font-medium text-green-800">Disponível</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}