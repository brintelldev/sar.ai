import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: string;
  title: string;
  status: string;
  enrolledCount?: number;
}

interface CourseActionsModalProps {
  course: Course | null;
  action: 'delete' | 'deactivate' | 'activate' | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseActionsModal({ course, action, isOpen, onClose }: CourseActionsModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: "DELETE" }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir curso');
      }
      // Status 204 returns no content, so return empty object
      return response.status === 204 ? {} : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso excluído com sucesso",
        description: "O curso foi removido permanentemente do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/admin'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ courseId, status }: { courseId: string; status: string }) => {
      const response = await fetch(`/api/courses/${courseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar status');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      const actionText = variables.status === 'inactive' ? 'desativado' : 'ativado';
      toast({
        title: `Curso ${actionText} com sucesso`,
        description: `O status do curso foi alterado para ${variables.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses/admin'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  const handleConfirm = () => {
    if (!course) return;

    if (action === 'delete') {
      if (confirmationText !== "DELETE") {
        toast({
          title: "Confirmação incorreta",
          description: "Digite exatamente 'DELETE' para confirmar a exclusão.",
          variant: "destructive",
        });
        return;
      }
      deleteMutation.mutate(course.id);
    } else if (action === 'deactivate') {
      statusMutation.mutate({ courseId: course.id, status: 'inactive' });
    } else if (action === 'activate') {
      statusMutation.mutate({ courseId: course.id, status: 'published' });
    }
  };

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  if (!course || !action) return null;

  const isLoading = deleteMutation.isPending || statusMutation.isPending;

  const getActionConfig = () => {
    switch (action) {
      case 'delete':
        return {
          title: "Excluir Curso",
          description: "Esta ação é irreversível e removerá permanentemente o curso e todos os dados relacionados.",
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          buttonText: "Excluir Permanentemente",
          buttonVariant: "destructive" as const,
          requiresConfirmation: true,
          warningText: "ATENÇÃO: Esta ação não pode ser desfeita!"
        };
      case 'deactivate':
        return {
          title: "Desativar Curso",
          description: "O curso ficará indisponível para novos alunos, mas os dados serão preservados.",
          icon: <PowerOff className="w-6 h-6 text-orange-600" />,
          buttonText: "Desativar Curso",
          buttonVariant: "outline" as const,
          requiresConfirmation: false,
          warningText: "Alunos matriculados poderão continuar acessando o curso."
        };
      case 'activate':
        return {
          title: "Ativar Curso",
          description: "O curso ficará disponível para novos alunos se inscreverem.",
          icon: <Power className="w-6 h-6 text-green-600" />,
          buttonText: "Ativar Curso",
          buttonVariant: "default" as const,
          requiresConfirmation: false,
          warningText: "O curso aparecerá na listagem pública de cursos."
        };
      default:
        return null;
    }
  };

  const config = getActionConfig();
  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {config.icon}
            <span>{config.title}</span>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>{config.description}</p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium">Curso: {course.title}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                  {course.enrolledCount !== undefined && (
                    <span className="text-sm text-gray-600">
                      {course.enrolledCount} alunos matriculados
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {config.warningText && (
          <div className="flex items-start space-x-2 bg-yellow-50 border border-yellow-200 p-3 rounded">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">{config.warningText}</p>
          </div>
        )}

        {config.requiresConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Digite <strong>DELETE</strong> para confirmar:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite DELETE"
              className="font-mono"
            />
          </div>
        )}

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={
              isLoading || 
              (config.requiresConfirmation && confirmationText !== "DELETE")
            }
          >
            {isLoading ? "Processando..." : config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}