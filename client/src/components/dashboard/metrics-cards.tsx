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
      change: metrics.projectsChange,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Total Arrecadado',
      value: formatCurrency(metrics.totalDonated),
      change: metrics.donationsChange,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Beneficiários Atendidos',
      value: metrics.beneficiariesServed,
      change: metrics.beneficiariesChange,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Voluntários Ativos',
      value: metrics.activeVolunteers,
      change: metrics.volunteersChange,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="metric-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1 sm:mt-2">
                    {card.value}
                  </p>
                  <div className="flex items-center mt-1 sm:mt-2">
                    <span className={`text-xs sm:text-sm font-medium ${
                      card.change.includes('+') 
                        ? 'text-green-600 dark:text-green-400' 
                        : card.change.includes('-')
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-3`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
