import { Plus, UserPlus, Heart, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const actions = [
  {
    title: 'Criar Novo Projeto',
    href: '/projects',
    icon: Plus,
    color: 'text-blue-600',
  },
  {
    title: 'Cadastrar Doador',
    href: '/donors',
    icon: UserPlus,
    color: 'text-green-600',
  },
  {
    title: 'Adicionar Beneficiário',
    href: '/beneficiaries',
    icon: Heart,
    color: 'text-orange-600',
  },
  {
    title: 'Gerar Relatório',
    href: '/reports',
    icon: FileText,
    color: 'text-purple-600',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 sm:gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-2 sm:py-3 px-3 sm:px-4 bg-muted/50 hover:bg-muted border-border text-left"
                >
                  <Icon className={`h-4 w-4 mr-2 sm:mr-3 ${action.color} flex-shrink-0`} />
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {action.title}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
