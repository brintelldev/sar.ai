import { TrendingUp, DollarSign, Users, UserCheck, FolderKanban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useDashboardMetrics } from '@/hooks/use-organization';

export function MetricsCards() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Erro ao carregar métricas
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Projetos Ativos',
      value: metrics.activeProjects,
      change: '+2 este mês',
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Total Arrecadado',
      value: formatCurrency(metrics.totalDonated),
      change: '+15% este mês',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Beneficiários Atendidos',
      value: metrics.beneficiariesServed,
      change: '+8 este mês',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Voluntários Ativos',
      value: metrics.activeVolunteers,
      change: '5 novos este mês',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {card.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
