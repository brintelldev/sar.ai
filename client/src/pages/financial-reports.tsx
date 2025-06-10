import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Calendar, Filter } from 'lucide-react';

export default function FinancialReports() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('current-month');
  const [selectedYear, setSelectedYear] = useState('2024');

  const { data: donations } = useQuery({
    queryKey: ['/api/donations'],
  });

  const { data: accountsReceivable } = useQuery({
    queryKey: ['/api/accounts-receivable'],
  });

  const { data: accountsPayable } = useQuery({
    queryKey: ['/api/accounts-payable'],
  });

  // Calculate financial metrics
  const totalDonations = Array.isArray(donations) ? 
    donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0) : 0;

  const totalReceivable = Array.isArray(accountsReceivable) ? 
    accountsReceivable.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0) : 0;

  const totalPayable = Array.isArray(accountsPayable) ? 
    accountsPayable.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0) : 0;

  const netBalance = totalDonations + totalReceivable - totalPayable;

  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', donations: 15000, expenses: 8500, balance: 6500 },
    { month: 'Fev', donations: 18500, expenses: 12000, balance: 6500 },
    { month: 'Mar', donations: 22000, expenses: 9800, balance: 12200 },
    { month: 'Abr', donations: 19200, expenses: 11500, balance: 7700 },
    { month: 'Mai', donations: 25800, expenses: 13200, balance: 12600 },
    { month: 'Jun', donations: 21500, expenses: 10800, balance: 10700 },
  ];

  const expenseCategories = [
    { name: 'Administrativo', value: 35000, color: '#8884d8' },
    { name: 'Projetos', value: 45000, color: '#82ca9d' },
    { name: 'Operacional', value: 25000, color: '#ffc658' },
    { name: 'Marketing', value: 15000, color: '#ff7c7c' },
  ];

  const donationSources = [
    { name: 'Website', value: 40000, color: '#8884d8' },
    { name: 'Instagram', value: 25000, color: '#82ca9d' },
    { name: 'Eventos', value: 35000, color: '#ffc658' },
    { name: 'Parcerias', value: 20000, color: '#ff7c7c' },
  ];

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDonations)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceivable)}</div>
            <p className="text-xs text-muted-foreground">
              Valores pendentes de recebimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayable)}</div>
            <p className="text-xs text-muted-foreground">
              Compromissos financeiros pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? 'Posição positiva' : 'Déficit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
            <CardDescription>
              Comparativo entre doações recebidas e despesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="donations" fill="#8884d8" name="Doações" />
                <Bar dataKey="expenses" fill="#82ca9d" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
            <CardDescription>
              Por categoria nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência Financeira</CardTitle>
          <CardDescription>
            Evolução do saldo ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderDonationsReport = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doações por Fonte</CardTitle>
            <CardDescription>
              Origem das doações recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donationSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {donationSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Doações</CardTitle>
            <CardDescription>
              Lista das doações recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(donations) && donations.length > 0 ? donations.slice(0, 5).map((donation: any) => (
                <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(parseFloat(donation.amount))}</p>
                    <p className="text-sm text-muted-foreground">
                      {donation.campaignSource || 'Fonte não informada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{donation.paymentMethod?.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(donation.donationDate || donation.createdAt)}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma doação registrada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExpensesReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Despesas</CardTitle>
          <CardDescription>
            Detalhamento das despesas por categoria e período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="expenses" fill="#82ca9d" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar Pendentes</CardTitle>
            <CardDescription>
              Valores em aberto por vencimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(accountsPayable) && accountsPayable.length > 0 ? accountsPayable.slice(0, 5).map((account: any) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{account.supplierName}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(parseFloat(account.amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      Venc: {formatDate(account.dueDate)}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma conta a pagar registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Percentual de gastos por área
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(category.value)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((category.value / expenseCategories.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentReport = () => {
    switch (reportType) {
      case 'donations':
        return renderDonationsReport();
      case 'expenses':
        return renderExpensesReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
            <p className="text-muted-foreground mt-2">
              Análise completa da situação financeira da organização
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="donations">Doações</SelectItem>
              <SelectItem value="expenses">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mês Atual</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
              <SelectItem value="current-year">Ano Atual</SelectItem>
              <SelectItem value="last-year">Ano Anterior</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Report Content */}
        {renderCurrentReport()}
      </div>
    </MainLayout>
  );
}