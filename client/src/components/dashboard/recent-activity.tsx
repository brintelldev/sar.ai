import { DollarSign, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';

// Mock data for recent activities - in real app this would come from API
const activities = [
  {
    id: 1,
    type: 'donation',
    title: 'Nova doação recebida',
    description: 'João Silva doou R$ 500,00',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    icon: DollarSign,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    id: 2,
    type: 'volunteer',
    title: 'Novo voluntário cadastrado',
    description: 'Ana Costa se inscreveu como voluntária',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    icon: UserPlus,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: 3,
    type: 'alert',
    title: 'Prazo de relatório próximo',
    description: 'Relatório mensal vence em 3 dias',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100 dark:bg-orange-900/20',
  },
  {
    id: 4,
    type: 'project',
    title: 'Projeto atualizado',
    description: 'Projeto Alimentação Escolar - 68% concluído',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    icon: CheckCircle,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100 dark:bg-purple-900/20',
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
