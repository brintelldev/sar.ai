import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings, Eye, Edit, Trash2, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: Record<string, boolean>;
}

interface AccessControlSettings {
  id: string;
  organizationId: string;
  modulePermissions: Record<string, Record<string, boolean>>;
  restrictionSettings: Record<string, any>;
}

const modules = [
  {
    name: 'Beneficiários',
    key: 'beneficiaries',
    permissions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista e detalhes dos beneficiários' },
      { key: 'edit', label: 'Editar', description: 'Modificar dados dos beneficiários' },
      { key: 'delete', label: 'Excluir', description: 'Remover beneficiários do sistema' },
      { key: 'export', label: 'Exportar', description: 'Baixar dados dos beneficiários' }
    ]
  },
  {
    name: 'Projetos',
    key: 'projects',
    permissions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista e detalhes dos projetos' },
      { key: 'edit', label: 'Editar', description: 'Modificar projetos existentes' },
      { key: 'delete', label: 'Excluir', description: 'Remover projetos do sistema' },
      { key: 'create', label: 'Criar', description: 'Adicionar novos projetos' }
    ]
  },
  {
    name: 'Voluntários',
    key: 'volunteers',
    permissions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista e detalhes dos voluntários' },
      { key: 'edit', label: 'Editar', description: 'Modificar dados dos voluntários' },
      { key: 'delete', label: 'Excluir', description: 'Remover voluntários do sistema' },
      { key: 'assign', label: 'Atribuir', description: 'Atribuir voluntários a projetos' }
    ]
  },
  {
    name: 'Finanças',
    key: 'finances',
    permissions: [
      { key: 'view', label: 'Visualizar', description: 'Ver dados financeiros' },
      { key: 'edit', label: 'Editar', description: 'Modificar registros financeiros' },
      { key: 'approve', label: 'Aprovar', description: 'Aprovar transações financeiras' },
      { key: 'reports', label: 'Relatórios', description: 'Gerar relatórios financeiros' }
    ]
  },
  {
    name: 'Cursos',
    key: 'courses',
    permissions: [
      { key: 'view', label: 'Visualizar', description: 'Ver lista e detalhes dos cursos' },
      { key: 'edit', label: 'Editar', description: 'Modificar cursos existentes' },
      { key: 'create', label: 'Criar', description: 'Adicionar novos cursos' },
      { key: 'enroll', label: 'Inscrever', description: 'Inscrever beneficiários em cursos' }
    ]
  }
];

const roles = [
  { key: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { key: 'manager', label: 'Gestor', color: 'bg-blue-100 text-blue-800' },
  { key: 'volunteer', label: 'Voluntário', color: 'bg-green-100 text-green-800' },
  { key: 'beneficiary', label: 'Beneficiário', color: 'bg-purple-100 text-purple-800' }
];

export default function AccessControl() {
  const { currentOrganization } = useAuth();
  const [settings, setSettings] = useState<AccessControlSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    loadAccessControlSettings();
  }, [currentOrganization]);

  const loadAccessControlSettings = async () => {
    if (!currentOrganization) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/access-control');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setPermissions(data.modulePermissions || {});
      } else {
        // Se não existir, criar estrutura padrão
        const defaultPermissions: Record<string, Record<string, boolean>> = {};
        modules.forEach(module => {
          defaultPermissions[module.key] = {};
          roles.forEach(role => {
            defaultPermissions[module.key][role.key] = role.key === 'admin';
          });
        });
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de acesso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (moduleKey: string, roleKey: string, permissionKey: string, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [`${roleKey}_${permissionKey}`]: enabled
      }
    }));
  };

  const saveSettings = async () => {
    if (!currentOrganization) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/access-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          modulePermissions: permissions,
          restrictionSettings: {}
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de acesso salvas com sucesso.",
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Controle de Acesso</h1>
              <p className="text-muted-foreground">
                Configure as permissões e restrições para cada grupo de usuários
              </p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={isSaving} className="flex items-center space-x-2">
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </Button>
        </div>

        <Tabs defaultValue="permissions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="permissions">Permissões por Módulo</TabsTrigger>
            <TabsTrigger value="restrictions">Restrições</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissões por Módulo</CardTitle>
                <CardDescription>
                  Configure o que cada grupo de usuários pode fazer em cada módulo do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {modules.map((module) => (
                    <div key={module.key} className="border rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <h3 className="text-lg font-semibold">{module.name}</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Permissão</th>
                              {roles.map((role) => (
                                <th key={role.key} className="text-center py-3 px-4 min-w-[120px]">
                                  <Badge className={role.color}>
                                    {role.label}
                                  </Badge>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {module.permissions.map((permission) => (
                              <tr key={permission.key} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{permission.label}</div>
                                    <div className="text-sm text-gray-500">{permission.description}</div>
                                  </div>
                                </td>
                                {roles.map((role) => (
                                  <td key={role.key} className="py-4 px-4 text-center">
                                    <Switch
                                      checked={permissions[module.key]?.[`${role.key}_${permission.key}`] || false}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(module.key, role.key, permission.key, checked)
                                      }
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restrictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Restrições</CardTitle>
                <CardDescription>
                  Configure restrições específicas por grupo de usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>
                  Modelos pré-configurados de permissões para diferentes tipos de usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auditoria</CardTitle>
                <CardDescription>
                  Histórico de alterações nas configurações de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}