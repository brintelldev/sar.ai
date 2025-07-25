import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, Shield, Database, Users, Mail, Globe, Palette } from 'lucide-react';
import { formatCurrency, formatDate, maskCNPJ, maskPhone } from '@/lib/utils';

export default function Settings() {
  const { user, currentOrganization, userRole } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Verificar se o usuário tem permissão de administrador
  const isAdmin = userRole === 'admin' || userRole === 'manager';

  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      setAccountForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || ''
      }));
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [organizationForm, setOrganizationForm] = useState({
    name: currentOrganization?.name || '',
    cnpj: currentOrganization?.cnpj || '',
    email: currentOrganization?.email || '',
    phone: currentOrganization?.phone || '',
    address: currentOrganization?.address || ''
  });

  // Atualizar formulário quando dados da organização mudarem
  useEffect(() => {
    if (currentOrganization) {
      setOrganizationForm({
        name: currentOrganization.name || '',
        cnpj: currentOrganization.cnpj || '',
        email: currentOrganization.email || '',
        phone: currentOrganization.phone || '',
        address: currentOrganization.address || ''
      });
    }
  }, [currentOrganization]);

  const updateAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Enviando dados:', data);
      return apiRequest('/api/user/update', 'PATCH', data);
    },
    onSuccess: (response) => {
      console.log('Sucesso:', response);
      toast({
        title: "Sucesso",
        description: "Informações da conta atualizadas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações da conta",
        variant: "destructive",
      });
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/user/preferences', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Preferências atualizadas com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferências",
        variant: "destructive",
      });
    }
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/user/notifications', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configurações de notificação salvas com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de notificação",
        variant: "destructive",
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/user/change-password', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });
      // Limpar o formulário após sucesso
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    }
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/organizations/update', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Informações da organização atualizadas com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações da organização",
        variant: "destructive",
      });
    }
  });

  const handleSaveAccount = () => {
    updateAccountMutation.mutate(accountForm);
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({ notifications, preferences });
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate(notifications);
  };

  const handleSaveSecurity = () => {
    // Validações
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "Todos os campos de senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Enviar requisição para alterar senha
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleSaveOrganization = () => {
    if (!isAdmin) {
      toast({
        title: "Erro",
        description: "Apenas administradores podem editar as configurações da organização",
        variant: "destructive",
      });
      return;
    }

    updateOrganizationMutation.mutate(organizationForm);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCNPJ(e.target.value);
    setOrganizationForm({ ...organizationForm, cnpj: maskedValue });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskPhone(e.target.value);
    setOrganizationForm({ ...organizationForm, phone: maskedValue });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua conta e organização
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="organization">Organização</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Informações da Conta</span>
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Nome Completo</Label>
                    <Input 
                      id="account-name" 
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email</Label>
                    <Input 
                      id="account-email" 
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-phone">Telefone</Label>
                    <Input 
                      id="account-phone" 
                      placeholder="(11) 99999-9999"
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-position">Cargo</Label>
                    <Input 
                      id="account-position" 
                      value={accountForm.position}
                      onChange={(e) => setAccountForm({...accountForm, position: e.target.value})}
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveAccount}
                    disabled={updateAccountMutation.isPending}
                  >
                    {updateAccountMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Preferências de Notificação</span>
                </CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba updates importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas urgentes por SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações no navegador
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba dicas e novidades sobre a plataforma
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, marketing: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={updateNotificationsMutation.isPending}
                  >
                    {updateNotificationsMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Segurança da Conta</span>
                </CardTitle>
                <CardDescription>
                  Gerencie a segurança e privacidade da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Alterar Senha</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Mantenha sua conta segura com uma senha forte
                    </p>
                    <div className="space-y-3">
                      <Input 
                        type="password" 
                        placeholder="Senha atual"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                      <Input 
                        type="password" 
                        placeholder="Nova senha"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                      <Input 
                        type="password" 
                        placeholder="Confirmar nova senha"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>

                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSecurity}
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Settings */}
          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Configurações da Organização</span>
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações da {currentOrganization?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Organização</Label>
                    <Input 
                      value={organizationForm.name}
                      onChange={(e) => setOrganizationForm({...organizationForm, name: e.target.value})}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={organizationForm.cnpj}
                      onChange={handleCnpjChange}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Institucional</Label>
                    <Input 
                      value={organizationForm.email}
                      onChange={(e) => setOrganizationForm({...organizationForm, email: e.target.value})}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={organizationForm.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 3333-3333" 
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={organizationForm.address}
                    onChange={(e) => setOrganizationForm({...organizationForm, address: e.target.value})}
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP" 
                    disabled={!isAdmin}
                  />
                </div>
                <Separator />
                <div>
                  <Label className="text-base font-medium">Plano de Assinatura</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Plano atual: <Badge className="capitalize">{currentOrganization?.subscriptionPlan}</Badge>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!isAdmin}
                  >
                    Gerenciar Plano
                  </Button>
                </div>
                {!isAdmin && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground text-center">
                      ⚠️ Apenas administradores podem editar as configurações da organização
                    </p>
                  </div>
                )}
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveOrganization}
                    disabled={updateOrganizationMutation.isPending || !isAdmin}
                  >
                    {updateOrganizationMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Settings */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Preferências do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Personalize a experiência da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={preferences.language} onValueChange={(value) => 
                      setPreferences({ ...preferences, language: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                        <SelectItem value="es-ES">Espanhol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select value={preferences.timezone} onValueChange={(value) => 
                      setPreferences({ ...preferences, timezone: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select value={theme} onValueChange={(value) => {
                      setTheme(value as 'light' | 'dark');
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select value={preferences.currency} onValueChange={(value) => 
                      setPreferences({ ...preferences, currency: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={updatePreferencesMutation.isPending}
                  >
                    {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}