import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Settings, 
  Shield, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Lock, 
  Unlock, 
  Check, 
  X,
  AlertTriangle,
  Info,
  Save
} from 'lucide-react';

// Tipos para as permissões
interface ModulePermissions {
  [module: string]: {
    [role: string]: string[];
  };
}

interface AccessControlSettings {
  id?: string;
  organizationId: string;
  modulePermissions: ModulePermissions;
  roleHierarchy: { [role: string]: string[] };
  restrictionSettings: {
    allowDataExport: { [role: string]: boolean };
    allowUserManagement: { [role: string]: boolean };
    requireApproval: { [action: string]: boolean };
  };
  auditSettings: {
    logUserActions: boolean;
    logDataAccess: boolean;
    retentionDays: number;
  };
  lastModifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PermissionTemplate {
  id?: string;
  name: string;
  description: string;
  role: string;
  permissions: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt?: string;
}

// Schema para validação do formulário de template
const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  role: z.string().min(1, 'Cargo é obrigatório'),
  permissions: z.record(z.any()),
  isDefault: z.boolean().default(false)
});

// Mapeamento dos módulos do sistema
const MODULES = {
  dashboard: 'Painel',
  projects: 'Projetos',
  beneficiaries: 'Beneficiárias',
  volunteers: 'Voluntários',
  donors: 'Doadores',
  donations: 'Doações',
  financials: 'Financeiro',
  courses: 'Capacitação',
  reports: 'Relatórios',
  settings: 'Configurações'
};

const ROLES = {
  admin: 'Administrador',
  manager: 'Gestor',
  volunteer: 'Voluntário',
  beneficiary: 'Beneficiária'
};

const PERMISSIONS = {
  read: 'Visualizar',
  write: 'Editar',
  delete: 'Excluir'
};

export default function AccessControlPage() {
  const [selectedTab, setSelectedTab] = useState('permissions');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações de controle de acesso
  const { data: accessControlSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/access-control'],
    staleTime: 5 * 60 * 1000,
  });

  // Buscar templates de permissão
  const { data: permissionTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/permission-templates'],
    staleTime: 5 * 60 * 1000,
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AccessControlSettings>) => {
      const response = await fetch('/api/access-control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-control'] });
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações de controle de acesso foram salvas com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para criar/atualizar template
  const templateMutation = useMutation({
    mutationFn: async (data: { template: any; isEdit: boolean; id?: string }) => {
      const url = data.isEdit && data.id 
        ? `/api/permission-templates/${data.id}` 
        : '/api/permission-templates';
      const method = data.isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.template),
      });
      if (!response.ok) throw new Error('Erro ao salvar template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permission-templates'] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: 'Template salvo',
        description: 'O template de permissões foi salvo com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar template',
        description: 'Ocorreu um erro ao salvar o template.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/permission-templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao remover template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permission-templates'] });
      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover o template.',
        variant: 'destructive',
      });
    },
  });

  // Form para templates
  const templateForm = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      role: '',
      permissions: {},
      isDefault: false,
    },
  });

  // Função para atualizar permissão de módulo
  const updateModulePermission = (module: string, role: string, permission: string, enabled: boolean) => {
    if (!accessControlSettings || !accessControlSettings.modulePermissions) return;

    const currentPermissions = accessControlSettings.modulePermissions[module]?.[role] || [];
    const newPermissions = enabled
      ? [...currentPermissions, permission].filter((p: string, i: number, arr: string[]) => arr.indexOf(p) === i)
      : currentPermissions.filter((p: string) => p !== permission);

    const updatedSettings = {
      ...accessControlSettings,
      modulePermissions: {
        ...accessControlSettings.modulePermissions,
        [module]: {
          ...accessControlSettings.modulePermissions[module],
          [role]: newPermissions,
        },
      },
    };

    updateSettingsMutation.mutate(updatedSettings);
  };

  // Função para atualizar configurações de restrição
  const updateRestrictionSetting = (setting: string, role: string, value: boolean) => {
    if (!accessControlSettings || !accessControlSettings.restrictionSettings) return;

    const updatedSettings = {
      ...accessControlSettings,
      restrictionSettings: {
        ...accessControlSettings.restrictionSettings,
        [setting]: {
          ...(accessControlSettings.restrictionSettings as any)[setting],
          [role]: value,
        },
      },
    };

    updateSettingsMutation.mutate(updatedSettings);
  };

  // Função para salvar template
  const onSubmitTemplate = (data: any) => {
    templateMutation.mutate({
      template: data,
      isEdit: !!editingTemplate,
      id: editingTemplate?.id,
    });
  };

  // Verificar se tem permissão
  const hasPermission = (module: string, role: string, permission: string) => {
    if (!accessControlSettings?.modulePermissions) return false;
    return accessControlSettings.modulePermissions[module]?.[role]?.includes(permission) || false;
  };

  if (loadingSettings) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Controle de Acesso
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as permissões e restrições para cada grupo de usuários
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissões por Módulo</TabsTrigger>
          <TabsTrigger value="restrictions">Restrições</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Aba de Permissões por Módulo */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissões por Módulo</CardTitle>
              <CardDescription>
                Configure o que cada grupo de usuários pode fazer em cada módulo do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(MODULES).map(([moduleKey, moduleName]) => (
                  <div key={moduleKey} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">{moduleName}</h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="font-medium">Permissão</div>
                      {Object.entries(ROLES).map(([roleKey, roleName]) => (
                        <div key={roleKey} className="font-medium text-center">
                          {roleName}
                        </div>
                      ))}
                      
                      {Object.entries(PERMISSIONS).map(([permKey, permName]) => (
                        <div key={permKey} className="contents">
                          <div className="py-2">{permName}</div>
                          {Object.entries(ROLES).map(([roleKey]) => (
                            <div key={roleKey} className="flex justify-center py-2">
                              <Switch
                                checked={hasPermission(moduleKey, roleKey, permKey)}
                                onCheckedChange={(checked) =>
                                  updateModulePermission(moduleKey, roleKey, permKey, checked)
                                }
                                disabled={updateSettingsMutation.isPending}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Restrições */}
        <TabsContent value="restrictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Restrição</CardTitle>
              <CardDescription>
                Configure restrições especiais para cada grupo de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Exportação de Dados */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Exportação de Dados
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ROLES).map(([roleKey, roleName]) => (
                      <div key={roleKey} className="flex items-center justify-between">
                        <Label htmlFor={`export-${roleKey}`}>{roleName}</Label>
                        <Switch
                          id={`export-${roleKey}`}
                          checked={accessControlSettings?.restrictionSettings?.allowDataExport?.[roleKey] || false}
                          onCheckedChange={(checked) =>
                            updateRestrictionSetting('allowDataExport', roleKey, checked)
                          }
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gerenciamento de Usuários */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciamento de Usuários
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ROLES).map(([roleKey, roleName]) => (
                      <div key={roleKey} className="flex items-center justify-between">
                        <Label htmlFor={`users-${roleKey}`}>{roleName}</Label>
                        <Switch
                          id={`users-${roleKey}`}
                          checked={accessControlSettings?.restrictionSettings?.allowUserManagement?.[roleKey] || false}
                          onCheckedChange={(checked) =>
                            updateRestrictionSetting('allowUserManagement', roleKey, checked)
                          }
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Templates de Permissão</h2>
              <p className="text-sm text-muted-foreground">
                Crie templates reutilizáveis para facilitar a configuração de permissões
              </p>
            </div>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Editar Template' : 'Novo Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure um template de permissões que pode ser aplicado a usuários
                  </DialogDescription>
                </DialogHeader>
                <Form {...templateForm}>
                  <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Template</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gestor de Projetos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva as responsabilidades deste template..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo Base</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(ROLES).map(([key, name]) => (
                                <SelectItem key={key} value={key}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Template Padrão</FormLabel>
                            <FormDescription>
                              Aplicar automaticamente para novos usuários deste cargo
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={templateMutation.isPending}>
                        {templateMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {loadingTemplates ? (
              <div className="text-center py-8">Carregando templates...</div>
            ) : permissionTemplates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum template encontrado</p>
                    <p className="text-sm">Crie templates para facilitar a configuração de permissões</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              permissionTemplates.map((template: PermissionTemplate) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.isDefault && (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template);
                            templateForm.reset({
                              name: template.name,
                              description: template.description || '',
                              role: template.role,
                              permissions: template.permissions,
                              isDefault: template.isDefault,
                            });
                            setIsTemplateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o template "{template.name}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplateMutation.mutate(template.id!)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardDescription>
                      {template.description || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Cargo: {ROLES[template.role as keyof typeof ROLES]}</span>
                      <span>•</span>
                      <span>Criado em {new Date(template.createdAt!).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Aba de Auditoria */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Auditoria</CardTitle>
              <CardDescription>
                Configure o registro de atividades e logs de acesso do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-actions">Registrar Ações dos Usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Manter log de todas as ações realizadas pelos usuários
                  </p>
                </div>
                <Switch
                  id="log-actions"
                  checked={accessControlSettings?.auditSettings?.logUserActions || false}
                  onCheckedChange={(checked) => {
                    if (accessControlSettings) {
                      const updatedSettings = {
                        ...accessControlSettings,
                        auditSettings: {
                          ...accessControlSettings.auditSettings,
                          logUserActions: checked,
                        },
                      };
                      updateSettingsMutation.mutate(updatedSettings);
                    }
                  }}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-access">Registrar Acesso a Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Manter log de quando dados sensíveis são acessados
                  </p>
                </div>
                <Switch
                  id="log-access"
                  checked={accessControlSettings?.auditSettings?.logDataAccess || false}
                  onCheckedChange={(checked) => {
                    if (accessControlSettings) {
                      const updatedSettings = {
                        ...accessControlSettings,
                        auditSettings: {
                          ...accessControlSettings.auditSettings,
                          logDataAccess: checked,
                        },
                      };
                      updateSettingsMutation.mutate(updatedSettings);
                    }
                  }}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention-days">Período de Retenção (dias)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={accessControlSettings?.auditSettings.retentionDays || 90}
                  onChange={(e) => {
                    if (accessControlSettings) {
                      const updatedSettings = {
                        ...accessControlSettings,
                        auditSettings: {
                          ...accessControlSettings.auditSettings,
                          retentionDays: parseInt(e.target.value) || 90,
                        },
                      };
                      updateSettingsMutation.mutate(updatedSettings);
                    }
                  }}
                  disabled={updateSettingsMutation.isPending}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Logs mais antigos que este período serão automaticamente removidos
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Conformidade LGPD
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      Estas configurações ajudam a manter conformidade com a Lei Geral de Proteção de Dados (LGPD).
                      Logs de auditoria são essenciais para demonstrar controles de acesso adequados.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}