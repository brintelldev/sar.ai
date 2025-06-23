import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Megaphone, 
  Plus,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";

interface PlatformOverview {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  billingCycle: string;
  features: string[];
  limits: any;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  targetAudience: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get tab from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");

  // Fetch platform overview
  const { data: overview, isLoading: overviewLoading } = useQuery<PlatformOverview>({
    queryKey: ['/api/admin/overview'],
  });

  // Fetch organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations'],
  });

  // Fetch subscription plans
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/admin/plans'],
  });

  // Fetch announcements
  const { data: announcements = [] } = useQuery<SystemAnnouncement[]>({
    queryKey: ['/api/admin/announcements'],
  });

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Super Admin</h1>
          <p className="text-muted-foreground mt-2">
            Painel de controle da plataforma SaaS
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="organizations">Organizações</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="announcements">Anúncios</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab overview={overview} />
            
            {/* Resumo de atividades da plataforma */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Plataforma</CardTitle>
                <CardDescription>
                  Visão geral das atividades e status da plataforma SaaS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Status do Sistema</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="text-green-600">99.9%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span className="text-green-600">Ótima</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Última atualização</span>
                        <span className="text-muted-foreground">Hoje</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Métricas Recentes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Novos cadastros (7 dias)</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Organizações ativas</span>
                        <span>{overview?.activeOrganizations || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxa de crescimento</span>
                        <span className="text-green-600">+5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <OrganizationsTab organizations={organizations} />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <PlansTab plans={plans} />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <AnnouncementsTab announcements={announcements} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function OverviewTab({ overview }: { overview?: PlatformOverview }) {
  if (!overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Organizações</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">
            {overview.activeOrganizations} ativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Usuários registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {Number(overview.totalRevenue).toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita acumulada
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {Number(overview.monthlyRecurringRevenue).toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita recorrente mensal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationsTab({ organizations }: { organizations: Organization[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizações Cadastradas</CardTitle>
        <CardDescription>
          Todas as organizações que utilizam a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {organizations.map((org) => (
            <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{org.name}</h4>
                <p className="text-sm text-muted-foreground">{org.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={org.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {org.subscriptionPlan}
                  </Badge>
                  <Badge variant={org.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                    {org.subscriptionStatus}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(org.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlansTab({ plans }: { plans: SubscriptionPlan[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    features: [''],
    limits: { users: 0, projects: 0, storage: 0 },
    isActive: true,
    isPopular: false,
    sortOrder: 0
  });

  const createPlanMutation = useMutation({
    mutationFn: (planData: any) => apiRequest('/api/admin/plans', {
      method: 'POST',
      body: planData
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      setShowNewPlanForm(false);
      setNewPlan({
        name: '',
        description: '',
        price: '',
        billingCycle: 'monthly',
        features: [''],
        limits: { users: 0, projects: 0, storage: 0 },
        isActive: true,
        isPopular: false,
        sortOrder: 0
      });
      toast({ title: "Plano criado com sucesso!" });
    }
  });

  const handleCreatePlan = () => {
    createPlanMutation.mutate(newPlan);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Planos de Assinatura</CardTitle>
            <CardDescription>
              Gerencie os planos disponíveis na plataforma
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewPlanForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                {plan.isPopular && (
                  <Badge className="absolute -top-2 -right-2">Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-4">
                    R$ {Number(plan.price).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.billingCycle === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNewPlanForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Plano de Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Plano</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Plano Básico"
                />
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="99.90"
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do plano..."
              />
            </div>
            <div>
              <Label>Ciclo de Cobrança</Label>
              <Select
                value={newPlan.billingCycle}
                onValueChange={(value) => setNewPlan(prev => ({ ...prev, billingCycle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? 'Criando...' : 'Criar Plano'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewPlanForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnnouncementsTab({ announcements }: { announcements: SystemAnnouncement[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewAnnouncementForm, setShowNewAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all',
    isActive: true
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/announcements', {
      method: 'POST',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      setShowNewAnnouncementForm(false);
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'info',
        priority: 'normal',
        targetAudience: 'all',
        isActive: true
      });
      toast({ title: "Anúncio criado com sucesso!" });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Anúncios do Sistema</CardTitle>
            <CardDescription>
              Comunique-se com todas as organizações da plataforma
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewAnnouncementForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Anúncio
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {announcement.content}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{announcement.type}</Badge>
                      <Badge variant="outline">{announcement.priority}</Badge>
                      <Badge variant="outline">{announcement.targetAudience}</Badge>
                      {announcement.isActive && <Badge>Ativo</Badge>}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNewAnnouncementForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Anúncio do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do anúncio"
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Conteúdo do anúncio..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={newAnnouncement.type}
                  onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Público Alvo</Label>
                <Select
                  value={newAnnouncement.targetAudience}
                  onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, targetAudience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="free">Gratuito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => createAnnouncementMutation.mutate(newAnnouncement)}
                disabled={createAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending ? 'Criando...' : 'Criar Anúncio'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewAnnouncementForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalyticsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics da Plataforma
        </CardTitle>
        <CardDescription>
          Métricas detalhadas e análises da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Dashboard de analytics será implementado em breve com gráficos detalhados,
            métricas de uso, retenção de clientes e análises financeiras.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}