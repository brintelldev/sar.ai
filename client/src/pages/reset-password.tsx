import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      return apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword });
  };

  const navigateToLogin = () => {
    setLocation("/login");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Senha redefinida com sucesso!</CardTitle>
            <CardDescription>
              Sua senha foi alterada. Agora você pode fazer login com sua nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={navigateToLogin} className="w-full">
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              O link de redefinição de senha é inválido ou expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={navigateToLogin} variant="outline" className="w-full">
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  As senhas não coincidem
                </AlertDescription>
              </Alert>
            )}

            {newPassword && newPassword.length < 6 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A senha deve ter pelo menos 6 caracteres
                </AlertDescription>
              </Alert>
            )}

            {resetPasswordMutation.isError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {resetPasswordMutation.error?.message || "Erro ao redefinir senha"}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={
                resetPasswordMutation.isPending || 
                !newPassword || 
                !confirmPassword || 
                newPassword !== confirmPassword ||
                newPassword.length < 6
              }
            >
              {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>

            <div className="text-center mt-4">
              <Button 
                variant="link" 
                onClick={navigateToLogin}
                className="text-sm text-muted-foreground"
              >
                Voltar ao login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}