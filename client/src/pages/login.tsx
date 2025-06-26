import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/use-simple-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoSarai from '@/assets/logo_sarai.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, isLoginPending, isRegisterPending, loginError, registerError } = useAuth();
  const { toast } = useToast();

  // Forçar tema claro na página de login
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    organizationSlug: '',
  });

  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showResetForm, setShowResetForm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginForm, {
      onSuccess: () => {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo de volta!',
        });
        setLocation('/');
      },
      onError: (error) => {
        toast({
          title: 'Erro no login',
          description: error.message || 'Credenciais inválidas',
          variant: 'destructive',
        });
      },
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(registerForm, {
      onSuccess: () => {
        toast({
          title: 'Cadastro realizado com sucesso',
          description: 'Sua organização foi criada e você foi logado automaticamente.',
        });
        setLocation('/');
      },
      onError: (error) => {
        toast({
          title: 'Erro no cadastro',
          description: error.message || 'Erro ao criar conta',
          variant: 'destructive',
        });
      },
    });
  };

  const handleOrganizationNameChange = (value: string) => {
    setRegisterForm(prev => ({
      ...prev,
      organizationName: value,
      organizationSlug: slugify(value),
    }));
  };

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/auth/forgot-password', 'POST', { email });
      return response;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; token: string; newPassword: string }) => {
      const response = await apiRequest('/api/auth/reset-password', 'POST', data);
      return response;
    },
  });

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(forgotPasswordForm.email, {
      onSuccess: (data) => {
        toast({
          title: 'Email enviado',
          description: data.message,
        });
        if (data.resetToken) {
          // In development, show the token for testing
          setResetPasswordForm(prev => ({ 
            ...prev, 
            email: forgotPasswordForm.email,
            token: data.resetToken 
          }));
          setShowResetForm(true);
        }
        setForgotPasswordOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar email de recuperação',
          variant: 'destructive',
        });
      },
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (resetPasswordForm.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    resetPasswordMutation.mutate({
      email: resetPasswordForm.email,
      token: resetPasswordForm.token,
      newPassword: resetPasswordForm.newPassword,
    }, {
      onSuccess: (data) => {
        toast({
          title: 'Sucesso',
          description: data.message,
        });
        setShowResetForm(false);
        setResetPasswordForm({
          email: '',
          token: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao redefinir senha',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoSarai} 
              alt="SAR.AI" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-muted-foreground">
            Plataforma de gestão para organizações não governamentais
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Entrar na sua conta</CardTitle>
                <CardDescription>
                  Digite suas credenciais para acessar a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoginPending}>
                    {isLoginPending ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="text-center mt-4">
                    <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-sm text-muted-foreground">
                          Esqueci minha senha
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Recuperar senha</DialogTitle>
                          <DialogDescription>
                            Digite seu email para receber instruções de recuperação
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={forgotPasswordForm.email}
                              onChange={(e) => setForgotPasswordForm({ email: e.target.value })}
                              required
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={forgotPasswordMutation.isPending}
                          >
                            {forgotPasswordMutation.isPending ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar nova conta</CardTitle>
                <CardDescription>
                  Cadastre sua organização e comece a usar a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization-name">Nome da organização</Label>
                    <Input
                      id="organization-name"
                      type="text"
                      placeholder="Nome da sua ONG"
                      value={registerForm.organizationName}
                      onChange={(e) => handleOrganizationNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization-slug">URL da organização</Label>
                    <Input
                      id="organization-slug"
                      type="text"
                      placeholder="url-da-ong"
                      value={registerForm.organizationSlug}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, organizationSlug: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta será a URL de acesso da sua organização
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isRegisterPending}>
                    {isRegisterPending ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password Modal */}
        <Dialog open={showResetForm} onOpenChange={setShowResetForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>
                Digite o token recebido e sua nova senha
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetPasswordForm.email}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-token">Token de recuperação</Label>
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Token recebido por email"
                  value={resetPasswordForm.token}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, token: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}