import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Globe, Palette, Layout, FileText, Menu, Link as LinkIcon, Mail, Settings, Eye, ExternalLink, Plus, Edit, Trash2, ChevronUp, ChevronDown, EyeOff } from "lucide-react";

interface WhitelabelSite {
  id: string;
  organizationId: string;
  subdomain: string;
  customDomain?: string;
  isActive: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoUrl?: string;
  };
  content?: {
    hero?: {
      title: string;
      subtitle: string;
      ctaText: string;
    };
    about?: {
      title: string;
      description: string;
    };
    contact?: {
      email: string;
      phone: string;
      address: string;
    };
  };
  seoSettings?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
  analyticsCode?: string;
}

interface WhitelabelTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  templateData: any;
  preview: string;
  isDefault: boolean;
}

function SitePreview({ site }: { site: WhitelabelSite }) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getPreviewUrl = () => {
    if (site.customDomain) {
      return `https://${site.customDomain}`;
    }
    return `https://${site.subdomain}.sarai.org.br`;
  };

  const getFrameClasses = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-80 h-[600px]';
      case 'tablet':
        return 'w-[768px] h-[600px]';
      default:
        return 'w-full h-[800px]';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preview do Site</CardTitle>
              <CardDescription>
                Visualize como seu site aparece para os visitantes
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tablet')}
              >
                <Tablet className="h-4 w-4 mr-1" />
                Tablet
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {site.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">URL do Site:</span>
                  <span className="font-mono text-blue-800">{getPreviewUrl()}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={getPreviewUrl()} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </a>
                </Button>
              </div>

              <div className="border rounded-lg bg-gray-50 p-4 flex justify-center">
                <div className={`bg-white border rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${getFrameClasses()}`}>
                  <iframe
                    src={getPreviewUrl()}
                    className="w-full h-full"
                    title="Preview do Site"
                    onError={() => console.log('Erro ao carregar preview')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                  <Badge variant="default">Site Ativo</Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Tema</h4>
                  <p className="text-gray-600">{site.theme?.primaryColor || 'Padrão'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Última Atualização</h4>
                  <p className="text-gray-600">
                    {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <EyeOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Site Inativo</h3>
              <p className="text-gray-600 mb-4">
                Ative seu site nas configurações para visualizar o preview
              </p>
              <Button variant="outline">
                Ir para Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WhitelabelPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current site
  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['/api/whitelabel/site'],
    queryFn: () => apiRequest('/api/whitelabel/site')
  });

  // Get templates
  const { data: templates } = useQuery({
    queryKey: ['/api/whitelabel/templates'],
    queryFn: () => apiRequest('/api/whitelabel/templates')
  });

  // Create or update site
  const siteUpsertMutation = useMutation({
    mutationFn: (data: any) => {
      if (site) {
        return apiRequest('/api/whitelabel/site', 'PUT', data);
      } else {
        return apiRequest('/api/whitelabel/site', 'POST', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/site'] });
      toast({
        title: "Sucesso",
        description: "Site atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive",
      });
    },
  });

  const handleSiteSetup = (formData: any) => {
    siteUpsertMutation.mutate(formData);
  };

  const toggleSiteStatus = () => {
    if (site) {
      siteUpsertMutation.mutate({
        ...site,
        isActive: !site.isActive
      });
    }
  };

  if (siteLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Site Whitelabel</h1>
              <p className="text-gray-600 mt-2">
                Crie um site personalizado para sua organização com domínio próprio
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {site && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={site.isActive}
                      onCheckedChange={toggleSiteStatus}
                      disabled={siteUpsertMutation.isPending}
                    />
                    <Label>{site.isActive ? 'Ativo' : 'Inativo'}</Label>
                  </div>
                  {site.isActive && (
                    <Button variant="outline" asChild>
                      <a href={`https://${site.subdomain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Site
                      </a>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {!site ? (
          <SiteSetupCard onSetup={handleSiteSetup} isLoading={siteUpsertMutation.isPending} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">
                <Globe className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="h-4 w-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="pages">
                <FileText className="h-4 w-4 mr-2" />
                Páginas
              </TabsTrigger>
              <TabsTrigger value="menu">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="forms">
                <Mail className="h-4 w-4 mr-2" />
                Formulários
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <SiteOverview site={site} />
            </TabsContent>

            <TabsContent value="design">
              <DesignCustomization site={site} onUpdate={handleSiteSetup} isLoading={siteUpsertMutation.isPending} />
            </TabsContent>

            <TabsContent value="pages">
              <PagesManager siteId={site.id} />
            </TabsContent>

            <TabsContent value="menu">
              <MenuManager siteId={site.id} />
            </TabsContent>

            <TabsContent value="forms">
              <FormsManager siteId={site.id} />
            </TabsContent>

            <TabsContent value="preview">
              <SitePreview site={site} />
            </TabsContent>

            <TabsContent value="settings">
              <SiteSettings site={site} onUpdate={handleSiteSetup} isLoading={siteUpsertMutation.isPending} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

function SiteSetupCard({ onSetup, isLoading }: { onSetup: (data: any) => void; isLoading: boolean }) {
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim()) return;

    onSetup({
      subdomain: subdomain.trim().toLowerCase(),
      customDomain: customDomain.trim() || null,
      isActive: true,
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#64748b",
        fontFamily: "Inter"
      },
      content: {
        hero: {
          title: "Bem-vindos à nossa organização",
          subtitle: "Trabalhamos para construir um mundo melhor",
          ctaText: "Saiba Mais"
        }
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Configurar Seu Site</CardTitle>
        <CardDescription>
          Vamos criar seu site personalizado em alguns passos simples
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomínio *</Label>
            <div className="flex">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="minha-ong"
                className="rounded-r-none"
                required
              />
              <div className="bg-gray-100 border border-l-0 border-gray-300 px-3 py-2 text-sm text-gray-600 rounded-r-md">
                .plataforma.org
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Seu site ficará disponível em: https://{subdomain || 'minha-ong'}.plataforma.org
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">Domínio Personalizado (Opcional)</Label>
            <Input
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="www.minhaong.org"
            />
            <p className="text-xs text-gray-500">
              Configure seu próprio domínio (requer configuração DNS)
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Site"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SiteOverview({ site }: { site: WhitelabelSite }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Endereços do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Subdomínio Principal</Label>
            <div className="flex items-center space-x-2 mt-2">
              <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                {site.subdomain}
              </span>
              <Badge 
                variant={site.isActive ? "default" : "secondary"}
                className={site.isActive ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {site.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          {site.customDomain && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Domínio Personalizado</Label>
              <div className="bg-gray-100 px-3 py-1 rounded text-sm font-mono mt-2">
                {site.customDomain}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Visualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <Globe className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Preview do Site</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <a href={`/site/${site.subdomain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Site
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Site Publicado</span>
            <Badge 
              variant={site.isActive ? "default" : "secondary"}
              className={site.isActive ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-200 text-gray-600"}
            >
              {site.isActive ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Domínio Custom</span>
            <Badge 
              variant={site.customDomain ? "default" : "secondary"}
              className={site.customDomain ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-200 text-gray-600"}
            >
              {site.customDomain ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Analytics</span>
            <Badge 
              variant={site.analyticsCode ? "default" : "secondary"}
              className={site.analyticsCode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-200 text-gray-600"}
            >
              {site.analyticsCode ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DesignCustomization({ site, onUpdate, isLoading }: { 
  site: WhitelabelSite; 
  onUpdate: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [theme, setTheme] = useState(site.theme || {});

  const handleThemeUpdate = () => {
    onUpdate({
      ...site,
      theme
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalização Visual</CardTitle>
          <CardDescription>
            Customize as cores, fontes e layout do seu site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={theme.primaryColor || "#3b82f6"}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={theme.secondaryColor || "#64748b"}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fontFamily">Família de Fonte</Label>
                <Select
                  value={theme.fontFamily || "Inter"}
                  onValueChange={(value) => setTheme({ ...theme, fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input
                  id="logoUrl"
                  value={theme.logoUrl || ""}
                  onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleThemeUpdate} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PagesManager({ siteId }: { siteId: string }) {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['/api/whitelabel/pages'],
    queryFn: () => apiRequest('/api/whitelabel/pages')
  });

  useEffect(() => {
    if (pagesData) {
      setPages(pagesData);
    }
  }, [pagesData]);

  const createPageMutation = useMutation({
    mutationFn: (pageData: any) => apiRequest('/api/whitelabel/pages', 'POST', {
      ...pageData,
      siteId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/pages'] });
      setNewPage({ title: '', slug: '', content: '', isPublished: true });
      setShowNewPageForm(false);
      toast({
        title: "Sucesso",
        description: "Página criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar página",
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/whitelabel/pages/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/pages'] });
      setEditingPage(null);
      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar página",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest(`/api/whitelabel/pages/${pageId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/pages'] });
      toast({
        title: "Sucesso",
        description: "Página excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir página",
        variant: "destructive",
      });
    },
  });

  const handleCreatePage = () => {
    if (!newPage.title.trim() || !newPage.slug.trim()) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createPageMutation.mutate(newPage);
  };

  const handleUpdatePage = (pageData: any) => {
    updatePageMutation.mutate(pageData);
  };

  const handleDeletePage = (pageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;
    deletePageMutation.mutate(pageId);
  };

  const handleEditPage = (page: any) => {
    setEditingPage(page);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Páginas do Site</CardTitle>
            <CardDescription>
              Gerencie as páginas personalizadas do seu site
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewPageForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Página
          </Button>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando páginas...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma página personalizada criada</p>
              <Button onClick={() => setShowNewPageForm(true)} variant="outline">
                Criar primeira página
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{page.title}</h4>
                    <p className="text-sm text-gray-600">/{page.slug}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={page.isPublished ? "default" : "secondary"}>
                        {page.isPublished ? "Publicada" : "Rascunho"}
                      </Badge>
                      {page.createdAt && (
                        <span className="text-xs text-gray-500">
                          Criada em {new Date(page.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPage(page)}
                      disabled={updatePageMutation.isPending}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeletePage(page.id)}
                      disabled={deletePageMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Criar/Editar Página */}
      {(showNewPageForm || editingPage) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPage ? 'Editar Página' : 'Nova Página'}</CardTitle>
            <CardDescription>
              {editingPage ? 'Edite as informações da página' : 'Crie uma nova página para o seu site'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título da Página</Label>
                <Input
                  value={editingPage ? editingPage.title : newPage.title}
                  onChange={(e) => {
                    const value = e.target.value;
                    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    if (editingPage) {
                      setEditingPage(prev => ({ ...prev, title: value, slug }));
                    } else {
                      setNewPage(prev => ({ ...prev, title: value, slug }));
                    }
                  }}
                  placeholder="Ex: Sobre Nós"
                />
              </div>
              <div>
                <Label>URL da Página</Label>
                <div className="flex">
                  <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 text-sm text-gray-600 rounded-l-md">
                    /
                  </span>
                  <Input
                    value={editingPage ? editingPage.slug : newPage.slug}
                    onChange={(e) => {
                      if (editingPage) {
                        setEditingPage(prev => ({ ...prev, slug: e.target.value }));
                      } else {
                        setNewPage(prev => ({ ...prev, slug: e.target.value }));
                      }
                    }}
                    placeholder="sobre-nos"
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Conteúdo da Página</Label>
              <Textarea
                value={editingPage ? editingPage.content : newPage.content}
                onChange={(e) => {
                  if (editingPage) {
                    setEditingPage(prev => ({ ...prev, content: e.target.value }));
                  } else {
                    setNewPage(prev => ({ ...prev, content: e.target.value }));
                  }
                }}
                rows={8}
                placeholder="Digite o conteúdo da página... Você pode usar HTML simples para formatação."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dica: Use HTML para formatação (ex: &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={editingPage ? editingPage.isPublished : newPage.isPublished}
                onCheckedChange={(checked) => {
                  if (editingPage) {
                    setEditingPage(prev => ({ ...prev, isPublished: checked }));
                  } else {
                    setNewPage(prev => ({ ...prev, isPublished: checked }));
                  }
                }}
              />
              <Label htmlFor="isPublished">Publicar página</Label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex space-x-2">
                <Button 
                  onClick={editingPage ? () => handleUpdatePage(editingPage) : handleCreatePage}
                  disabled={createPageMutation.isPending || updatePageMutation.isPending}
                >
                  {createPageMutation.isPending || updatePageMutation.isPending ? 
                    'Salvando...' : 
                    (editingPage ? 'Atualizar Página' : 'Criar Página')
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewPageForm(false);
                    setEditingPage(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
              
              {editingPage && (
                <div className="text-right text-sm text-gray-500">
                  <p>Última atualização: {new Date(editingPage.updatedAt || editingPage.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MenuManager({ siteId }: { siteId: string }) {
  const [menuItems, setMenuItems] = useState([
    { id: '1', label: 'Início', url: '#inicio', order: 1, isVisible: true },
    { id: '2', label: 'Sobre', url: '#sobre', order: 2, isVisible: true },
    { id: '3', label: 'Projetos', url: '#projetos', order: 3, isVisible: true },
    { id: '4', label: 'Contato', url: '#contato', order: 4, isVisible: true }
  ]);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    label: '',
    url: '',
    isVisible: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMenuItem = () => {
    if (!newItem.label || !newItem.url) return;
    
    const menuItem = {
      id: Date.now().toString(),
      ...newItem,
      order: menuItems.length + 1
    };
    
    setMenuItems(prev => [...prev, menuItem]);
    setNewItem({ label: '', url: '', isVisible: true });
    setShowNewItemForm(false);
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    ));
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      setMenuItems(newItems);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < menuItems.length - 1) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setMenuItems(newItems);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Menu de Navegação</CardTitle>
            <CardDescription>
              Configure os itens do menu principal do site
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewItemForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {menuItems.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItemUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveItemDown(index)}
                      disabled={index === menuItems.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{item.label}</h4>
                    <p className="text-sm text-gray-600">{item.url}</p>
                    <Badge variant={item.isVisible ? "default" : "secondary"}>
                      {item.isVisible ? "Visível" : "Oculto"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(item.id)}
                  >
                    {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMenuItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNewItemForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Item do Menu</CardTitle>
            <CardDescription>
              Adicione um novo item ao menu de navegação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Texto do Menu</Label>
              <Input
                value={newItem.label}
                onChange={(e) => setNewItem(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Serviços"
              />
            </div>
            <div>
              <Label>URL ou Âncora</Label>
              <Input
                value={newItem.url}
                onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Ex: #servicos ou https://exemplo.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={newItem.isVisible}
                onChange={(e) => setNewItem(prev => ({ ...prev, isVisible: e.target.checked }))}
              />
              <Label htmlFor="isVisible">Visível no menu</Label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddMenuItem}>
                Adicionar Item
              </Button>
              <Button variant="outline" onClick={() => setShowNewItemForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FormsManager({ siteId }: { siteId: string }) {
  const [forms, setForms] = useState<any[]>([]);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null);
  const [newForm, setNewForm] = useState({
    name: '',
    type: 'contact',
    fields: ['name', 'email']
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get forms
  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ['/api/whitelabel/forms'],
    queryFn: () => apiRequest('/api/whitelabel/forms')
  });

  // Get form submissions
  const { data: submissions } = useQuery({
    queryKey: ['/api/whitelabel/forms', viewingSubmissions?.id, 'submissions'],
    queryFn: () => apiRequest(`/api/whitelabel/forms/${viewingSubmissions.id}/submissions`),
    enabled: !!viewingSubmissions
  });

  useEffect(() => {
    if (formsData) {
      setForms(formsData);
    }
  }, [formsData]);

  const createFormMutation = useMutation({
    mutationFn: (formData: any) => apiRequest('/api/whitelabel/forms', 'POST', {
      ...formData,
      siteId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/forms'] });
      setNewForm({ name: '', type: 'contact', fields: ['name', 'email'] });
      setShowNewFormModal(false);
      toast({
        title: "Sucesso",
        description: "Formulário criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar formulário",
        variant: "destructive",
      });
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/whitelabel/forms/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/forms'] });
      setEditingForm(null);
      toast({
        title: "Sucesso",
        description: "Formulário atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar formulário",
        variant: "destructive",
      });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: (formId: string) => apiRequest(`/api/whitelabel/forms/${formId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whitelabel/forms'] });
      toast({
        title: "Sucesso",
        description: "Formulário excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir formulário",
        variant: "destructive",
      });
    },
  });

  const formTypes = [
    { value: 'contact', label: 'Formulário de Contato' },
    { value: 'donation', label: 'Formulário de Doação' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'volunteer', label: 'Voluntariado' }
  ];

  const availableFields = [
    { value: 'name', label: 'Nome' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefone' },
    { value: 'message', label: 'Mensagem' },
    { value: 'amount', label: 'Valor da Doação' },
    { value: 'address', label: 'Endereço' },
    { value: 'cpf', label: 'CPF' }
  ];

  const handleCreateForm = () => {
    if (!newForm.name.trim()) return;
    createFormMutation.mutate(newForm);
  };

  const handleUpdateForm = (formData: any) => {
    updateFormMutation.mutate(formData);
  };

  const handleDeleteForm = (formId: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;
    deleteFormMutation.mutate(formId);
  };

  const handleEditForm = (form: any) => {
    setEditingForm(form);
  };

  const toggleFormStatus = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (form) {
      handleUpdateForm({ ...form, isActive: !form.isActive });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Formulários do Site</CardTitle>
            <CardDescription>
              Gerencie os formulários de captação de leads e contato
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Formulário
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{form.name}</h4>
                  <p className="text-sm text-gray-600">
                    Tipo: {formTypes.find(t => t.value === form.type)?.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    Campos: {form.fields.map(field => 
                      availableFields.find(f => f.value === field)?.label
                    ).join(', ')}
                  </p>
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFormStatus(form.id)}
                  >
                    {form.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteForm(form.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNewFormModal && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Formulário</CardTitle>
            <CardDescription>
              Crie um novo formulário para o seu site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Formulário</Label>
              <Input
                value={newForm.name}
                onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Contato Geral"
              />
            </div>
            <div>
              <Label>Tipo do Formulário</Label>
              <Select
                value={newForm.type}
                onValueChange={(value) => setNewForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campos do Formulário</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFields.map((field) => (
                  <div key={field.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={field.value}
                      checked={newForm.fields.includes(field.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewForm(prev => ({
                            ...prev,
                            fields: [...prev.fields, field.value]
                          }));
                        } else {
                          setNewForm(prev => ({
                            ...prev,
                            fields: prev.fields.filter(f => f !== field.value)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={field.value} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateForm}
                disabled={createFormMutation.isPending}
              >
                {createFormMutation.isPending ? 'Criando...' : 'Criar Formulário'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewFormModal(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para visualizar submissões */}
      {viewingSubmissions && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Submissões - {viewingSubmissions.name}</CardTitle>
              <CardDescription>
                Visualize e gerencie as submissões recebidas neste formulário
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setViewingSubmissions(null)}>
              Fechar
            </Button>
          </CardHeader>
          <CardContent>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission: any) => (
                  <div key={submission.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-500">
                        {new Date(submission.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <Badge variant="outline">
                        {submission.status || 'Nova'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(submission.data || {}).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-sm font-medium capitalize">
                            {availableFields.find(f => f.value === key)?.label || key}
                          </Label>
                          <p className="text-sm text-gray-700 mt-1">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma submissão recebida ainda</p>
                <p className="text-sm text-gray-500 mt-2">
                  As submissões aparecerão aqui quando os visitantes preencherem o formulário
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SiteSettings({ site, onUpdate, isLoading }: { 
  site: WhitelabelSite; 
  onUpdate: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [seoSettings, setSeoSettings] = useState(site.seoSettings || {});
  const [analyticsCode, setAnalyticsCode] = useState(site.analyticsCode || "");

  const handleSettingsUpdate = () => {
    onUpdate({
      ...site,
      seoSettings,
      analyticsCode
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de SEO</CardTitle>
          <CardDescription>
            Otimize seu site para mecanismos de busca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Título SEO</Label>
            <Input
              id="metaTitle"
              value={seoSettings.metaTitle || ""}
              onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
              placeholder="Nome da ONG - Fazendo a diferença"
            />
          </div>
          <div>
            <Label htmlFor="metaDescription">Descrição SEO</Label>
            <Textarea
              id="metaDescription"
              value={seoSettings.metaDescription || ""}
              onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
              placeholder="Descrição da organização e sua missão"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="keywords">Palavras-chave</Label>
            <Input
              id="keywords"
              value={seoSettings.keywords || ""}
              onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
              placeholder="ong, caridade, doação, voluntariado"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Configure o Google Analytics para monitorar acessos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="analyticsCode">Código do Google Analytics</Label>
            <Input
              id="analyticsCode"
              value={analyticsCode}
              onChange={(e) => setAnalyticsCode(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              Insira seu ID de medição do Google Analytics 4
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSettingsUpdate} disabled={isLoading}>
        {isLoading ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}