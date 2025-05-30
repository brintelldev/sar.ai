import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/use-simple-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, isLoginPending, isRegisterPending, loginError, registerError } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">ONGConnect</h1>
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
      </div>
    </div>
  );
}
