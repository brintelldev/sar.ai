import { useState } from "react";
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
import { Globe, Palette, Layout, FileText, Menu, Link as LinkIcon, Mail, Settings, Eye, ExternalLink } from "lucide-react";

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
            <TabsList className="grid w-full grid-cols-6">
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
            <Label className="text-sm font-medium">Subdomínio Principal</Label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {site.subdomain}
              </code>
              <Badge variant={site.isActive ? "default" : "secondary"}>
                {site.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          {site.customDomain && (
            <div>
              <Label className="text-sm font-medium">Domínio Personalizado</Label>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm block mt-1">
                {site.customDomain}
              </code>
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
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Preview do Site</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4" asChild>
            <a href={`https://${site.subdomain}`} target="_blank" rel="noopener noreferrer">
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
            <span className="text-sm">Site Publicado</span>
            <Badge variant={site.isActive ? "default" : "secondary"}>
              {site.isActive ? "Sim" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Domínio Custom</span>
            <Badge variant={site.customDomain ? "default" : "secondary"}>
              {site.customDomain ? "Configurado" : "Não"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Analytics</span>
            <Badge variant={site.analyticsCode ? "default" : "secondary"}>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Páginas</CardTitle>
        <CardDescription>
          Crie e edite as páginas do seu site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Funcionalidade em desenvolvimento</p>
          <p className="text-sm text-gray-500">
            Em breve você poderá criar páginas personalizadas com editor visual
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuManager({ siteId }: { siteId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Menu</CardTitle>
        <CardDescription>
          Configure o menu de navegação do seu site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Menu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Funcionalidade em desenvolvimento</p>
          <p className="text-sm text-gray-500">
            Em breve você poderá personalizar completamente o menu de navegação
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FormsManager({ siteId }: { siteId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Formulários</CardTitle>
        <CardDescription>
          Crie formulários de contato, doação e captação de leads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Funcionalidade em desenvolvimento</p>
          <p className="text-sm text-gray-500">
            Em breve você poderá criar formulários personalizados integrados ao WhatsApp
          </p>
        </div>
      </CardContent>
    </Card>
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