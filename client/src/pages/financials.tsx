import { useState } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, FileText, Calendar, DollarSign } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLocation } from 'wouter';

// Mock data for financial module - in real app this would come from API
const mockAccountsReceivable = [
  {
    id: '1',
    description: 'Doação recorrente - João Silva',
    amount: 500,
    dueDate: '2024-12-25',
    status: 'pending',
    donorName: 'João Silva',
    invoiceNumber: 'AR-2024-001'
  },
  {
    id: '2',
    description: 'Patrocínio - Empresa ABC Ltda',
    amount: 5000,
    dueDate: '2024-12-30',
    status: 'overdue',
    donorName: 'Empresa ABC Ltda',
    invoiceNumber: 'AR-2024-002'
  },
];

const mockAccountsPayable = [
  {
    id: '1',
    supplierName: 'Fornecedor de Alimentos XYZ',
    description: 'Compra de cestas básicas',
    amount: 2500,
    dueDate: '2024-12-20',
    status: 'pending',
    category: 'project'
  },
  {
    id: '2',
    supplierName: 'Empresa de Limpeza ABC',
    description: 'Serviços de limpeza - Novembro',
    amount: 800,
    dueDate: '2024-12-15',
    status: 'approved',
    category: 'administrative'
  },
];

const mockFunders = [
  {
    id: '1',
    name: 'Fundação Assistencial',
    type: 'foundation',
    contactPerson: 'Maria Santos',
    email: 'maria@fundacao.org',
    totalFunded: 50000,
    relationshipStatus: 'active',
    nextReportDue: '2025-01-15'
  },
  {
    id: '2',
    name: 'Governo Municipal',
    type: 'government',
    contactPerson: 'Carlos Oliveira',
    email: 'carlos@prefeitura.gov.br',
    totalFunded: 75000,
    relationshipStatus: 'active',
    nextReportDue: '2024-12-30'
  },
];

export default function Financials() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.includes('accounts-receivable')) return 'receivable';
    if (location.includes('accounts-payable')) return 'payable';
    if (location.includes('reports')) return 'reports';
    if (location.includes('funders')) return 'funders';
    return 'overview';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'received':
      case 'paid':
      case 'active':
        return 'status-active';
      case 'pending':
      case 'approved':
        return 'status-pending';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'status-warning';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'paid':
        return 'Pago';
      case 'received':
        return 'Recebido';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      case 'active':
        return 'Ativo';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'administrative':
        return 'Administrativo';
      case 'project':
        return 'Projeto';
      case 'operational':
        return 'Operacional';
      default:
        return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'government':
        return 'Governo';
      case 'foundation':
        return 'Fundação';
      case 'corporate':
        return 'Empresa';
      case 'international':
        return 'Internacional';
      default:
        return type;
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestão Financeira</h1>
          <p className="text-muted-foreground mt-2">
            Controle completo das finanças da sua organização
          </p>
        </div>

        <Tabs value={getActiveTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
            <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="funders">Financiadores</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(mockAccountsReceivable.reduce((sum, item) => sum + item.amount, 0))}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(mockAccountsPayable.reduce((sum, item) => sum + item.amount, 0))}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(
                          mockAccountsReceivable.reduce((sum, item) => sum + item.amount, 0) -
                          mockAccountsPayable.reduce((sum, item) => sum + item.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Financiadores</p>
                      <p className="text-2xl font-bold text-foreground">{mockFunders.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Receivables */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Recebimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAccountsReceivable.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">Vence em {formatDate(item.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                          <Badge className={`status-badge ${getStatusVariant(item.status)} text-xs`}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payables */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAccountsPayable.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">Vence em {formatDate(item.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                          <Badge className={`status-badge ${getStatusVariant(item.status)} text-xs`}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Receivable Tab */}
          <TabsContent value="receivable" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contas a receber..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Receber
              </Button>
            </div>

            <div className="space-y-4">
              {mockAccountsReceivable.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.donorName} • {item.invoiceNumber}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(item.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{formatCurrency(item.amount)}</p>
                        <Badge className={`status-badge ${getStatusVariant(item.status)} mt-2`}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Accounts Payable Tab */}
          <TabsContent value="payable" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contas a pagar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Pagar
              </Button>
            </div>

            <div className="space-y-4">
              {mockAccountsPayable.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.description}</h3>
                        <p className="text-sm text-muted-foreground">{item.supplierName}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Vencimento: {formatDate(item.dueDate)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{formatCurrency(item.amount)}</p>
                        <Badge className={`status-badge ${getStatusVariant(item.status)} mt-2`}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Demonstrativo Financeiro</h3>
                      <p className="text-sm text-muted-foreground">Relatório completo de receitas e despesas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
                      <p className="text-sm text-muted-foreground">Projeção de entradas e saídas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Prestação de Contas</h3>
                      <p className="text-sm text-muted-foreground">Relatórios para transparência</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funders Tab */}
          <TabsContent value="funders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar financiadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Financiador
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockFunders.map((funder) => (
                <Card key={funder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{funder.name}</h3>
                          <p className="text-sm text-muted-foreground">{getTypeLabel(funder.type)}</p>
                        </div>
                        <Badge className={`status-badge ${getStatusVariant(funder.relationshipStatus)}`}>
                          {getStatusLabel(funder.relationshipStatus)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Contato:</span>
                          <span className="text-foreground">{funder.contactPerson}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total financiado:</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(funder.totalFunded)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Próximo relatório:</span>
                          <span className="text-foreground">{formatDate(funder.nextReportDue)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button variant="ghost" size="sm">
                          Contatar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
