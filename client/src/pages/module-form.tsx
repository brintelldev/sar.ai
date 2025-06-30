import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, AlertCircle, Award, X, Check, AlertTriangle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CourseModule {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  content: any;
  videoUrl: string | null;
  materials: any;
  duration: number;
  isRequired: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  status: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'form' | 'embed';
  title?: string;
  content?: string;
  url?: string;
  embedCode?: string;
  formFields?: FormField[];
  metadata?: any;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  correctAnswer?: string | string[];
  points?: number;
  explanation?: string;
}

interface FormSubmission {
  id: string;
  userId: string;
  moduleId: string;
  responses: Record<string, any>;
  score: number;
  maxScore: number;
  completedAt: Date;
}

export function ModuleForm() {
  const { courseId, moduleId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [submissionResult, setSubmissionResult] = useState<FormSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get course details
  const { data: course } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId
  });

  // Get module details
  const { data: module, isLoading } = useQuery<CourseModule>({
    queryKey: ['/api/courses', courseId, 'modules', moduleId],
    queryFn: () => apiRequest(`/api/courses/${courseId}/modules/${moduleId}`),
    enabled: !!courseId && !!moduleId
  });

  // Get existing submission
  const { data: existingSubmission } = useQuery<FormSubmission>({
    queryKey: ['/api/modules', moduleId, 'form-submission'],
    queryFn: () => apiRequest(`/api/modules/${moduleId}/form-submission`),
    enabled: !!moduleId
  });

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: async (responses: Record<string, any>) => {
      return apiRequest(`/api/modules/${moduleId}/form-submission`, 'POST', { responses });
    },
    onSuccess: (data) => {
      setSubmissionResult(data);
      // Invalidate multiple caches to ensure all grade displays are updated
      queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId, 'form-submission'] });
      // Invalidate course grades cache to update the course detail page
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/module-grades`] });
      // Invalidate course progress cache
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
      
      const percentage = data.percentage || 0;
      const status = data.passed ? "Aprovado" : "Reprovado";
      const statusColor = data.passed ? "text-green-600" : "text-red-600";
      
      toast({
        title: `${status}! ${percentage}%`,
        description: `Você obteve ${data.score}/${data.maxScore} pontos (${data.correctAnswers}/${data.totalQuestions} respostas corretas).`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar formulário",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (!module) return;

    console.log('Form submission started:', { moduleId, formResponses });

    const contentBlocks = module.content?.blocks || [];
    const formBlocks = contentBlocks.filter((block: ContentBlock) => block.type === 'form');
    
    // Validar campos obrigatórios
    let hasErrors = false;
    for (const block of formBlocks) {
      if (block.formFields) {
        for (const field of block.formFields) {
          if (field.required && !formResponses[field.id]) {
            toast({
              title: "Campo obrigatório",
              description: `O campo "${field.label}" é obrigatório.`,
              variant: "destructive",
            });
            hasErrors = true;
            break;
          }
        }
      }
      if (hasErrors) break;
    }

    if (!hasErrors) {
      setIsSubmitting(true);
      try {
        console.log('Submitting form with responses:', formResponses);
        await submitFormMutation.mutateAsync(formResponses);
        console.log('Form submission successful');
      } catch (error) {
        console.error('Form submission error:', error);
      }
      setIsSubmitting(false);
    }
  };

  const handleResponseChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderFormField = (field: FormField) => {
    const value = formResponses[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={!!existingSubmission}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            disabled={!!existingSubmission}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            required={field.required}
            disabled={!!existingSubmission}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Selecione uma opção</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponseChange(field.id, e.target.value)}
                  required={field.required}
                  disabled={!!existingSubmission}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleResponseChange(field.id, e.target.checked ? 'true' : 'false')}
              required={field.required}
              disabled={!!existingSubmission}
            />
            <span>{field.label}</span>
          </label>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando formulário...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!module) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p>Módulo não encontrado.</p>
          <Button onClick={() => navigate(`/courses/${courseId}`)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Curso
          </Button>
        </div>
      </MainLayout>
    );
  }

  const contentBlocks = module.content?.blocks || [];
  const formBlocks = contentBlocks.filter((block: ContentBlock) => block.type === 'form');

  // Function to render detailed results
  const renderDetailedResults = (result: any) => {
    if (!result?.detailedResults) return null;

    const percentage = result.percentage || 0;
    const isApproved = result.passed;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Resultados Detalhados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Score */}
          <div className={`p-4 rounded-lg border-2 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isApproved ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
                    {isApproved ? 'Aprovado!' : 'Reprovado'}
                  </h3>
                  <p className={`text-sm ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
                    {result.correctAnswers}/{result.totalQuestions} respostas corretas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.score}/{result.maxScore} pontos
                </div>
              </div>
            </div>
          </div>

          {/* Individual Question Results */}
          <div className="space-y-3">
            <h4 className="font-semibold text-base">Resultado por Questão:</h4>
            {result.detailedResults.map((questionResult: any, index: number) => (
              <div key={questionResult.fieldId} className={`p-3 rounded border ${questionResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {questionResult.isCorrect ? (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <h5 className="font-medium text-sm">
                        Questão {index + 1}: {questionResult.fieldLabel}
                      </h5>
                    </div>
                    
                    <div className="space-y-1 text-sm pl-6">
                      <div>
                        <span className="font-medium">Sua resposta: </span>
                        <span className={questionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {typeof questionResult.userAnswer === 'boolean' 
                            ? (questionResult.userAnswer ? 'Sim' : 'Não')
                            : (questionResult.userAnswer || 'Não respondido')
                          }
                        </span>
                      </div>
                      {!questionResult.isCorrect && (
                        <div>
                          <span className="font-medium">Resposta correta: </span>
                          <span className="text-green-700">
                            {typeof questionResult.correctAnswer === 'boolean' 
                              ? (questionResult.correctAnswer ? 'Sim' : 'Não')
                              : questionResult.correctAnswer
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`text-sm font-medium ${questionResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {questionResult.pointsEarned}/{questionResult.pointsTotal} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isApproved && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Nota mínima não atingida</p>
                  <p>É necessário obter pelo menos 70% para ser aprovado. Você pode tentar novamente.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (formBlocks.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p>Este módulo não possui formulários.</p>
          <Button onClick={() => navigate(`/courses/${courseId}`)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Curso
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Curso
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{module.title}</h1>
              <p className="text-muted-foreground">{course?.title}</p>
            </div>
          </div>
          
          {existingSubmission && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="mr-1 h-3 w-3" />
              Concluído ({existingSubmission.score}/{existingSubmission.maxScore} pontos)
            </Badge>
          )}
        </div>

        {/* Module Description */}
        {module.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Forms */}
        <div className="space-y-6">
          {formBlocks.map((block: ContentBlock, blockIndex: number) => (
            <Card key={block.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {block.title || `Formulário ${blockIndex + 1}`}
                  {existingSubmission && (
                    <Badge variant="secondary">
                      Enviado em {new Date(existingSubmission.completedAt).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {block.formFields?.map((field: FormField) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        {!existingSubmission && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Formulário'}
            </Button>
          </div>
        )}

        {/* Display detailed results */}
        {submissionResult && renderDetailedResults(submissionResult)}
        {existingSubmission && !submissionResult && existingSubmission.answers?.detailedResults && renderDetailedResults({
          ...existingSubmission,
          detailedResults: existingSubmission.answers.detailedResults,
          percentage: Math.round((existingSubmission.score / existingSubmission.maxScore) * 100),
          totalQuestions: existingSubmission.answers.detailedResults.length,
          correctAnswers: existingSubmission.answers.detailedResults.filter((r: any) => r.isCorrect).length
        })}
      </div>
    </MainLayout>
  );
}