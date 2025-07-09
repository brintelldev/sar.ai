import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Calendar, Filter, RefreshCw } from 'lucide-react';

export default function FinancialReports() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('current-month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: donations, refetch: refetchDonations } = useQuery({
    queryKey: ['/api/donations'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const { data: accountsReceivable, refetch: refetchReceivable } = useQuery({
    queryKey: ['/api/accounts-receivable'],
    refetchInterval: 30000,
  });

  const { data: accountsPayable, refetch: refetchPayable } = useQuery({
    queryKey: ['/api/accounts-payable'],
    refetchInterval: 30000,
  });

  // Calculate financial metrics with real-time data
  const financialMetrics = useMemo(() => {
    const donationsData = Array.isArray(donations) ? donations : [];
    const receivableData = Array.isArray(accountsReceivable) ? accountsReceivable : [];
    const payableData = Array.isArray(accountsPayable) ? accountsPayable : [];

    const totalDonations = donationsData.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0);
    const totalReceivable = receivableData.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0);
    const totalPayable = payableData.reduce((sum: number, a: any) => sum + parseFloat(a.amount || 0), 0);
    const netBalance = totalDonations + totalReceivable - totalPayable;

    return {
      totalDonations,
      totalReceivable,
      totalPayable,
      netBalance,
      donationsData,
      receivableData,
      payableData
    };
  }, [donations, accountsReceivable, accountsPayable]);

  // Calculate available years from data
  const availableYears = useMemo(() => {
    const { donationsData, receivableData, payableData } = financialMetrics;
    const years = new Set<number>();

    // Add current year by default
    years.add(new Date().getFullYear());

    // Extract years from donations
    donationsData.forEach((donation: any) => {
      const date = new Date(donation.donationDate || donation.createdAt);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });

    // Extract years from accounts receivable
    receivableData.forEach((account: any) => {
      const date = new Date(account.dueDate || account.createdAt);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });

    // Extract years from accounts payable
    payableData.forEach((account: any) => {
      const date = new Date(account.dueDate || account.createdAt);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear());
      }
    });

    // Convert to sorted array (most recent first)
    return Array.from(years).sort((a, b) => b - a);
  }, [financialMetrics]);

  // Generate real-time chart data from actual platform data
  const chartData = useMemo(() => {
    const { donationsData, payableData, receivableData } = financialMetrics;
    
    // Group data by month
    const monthlyGroups: { [key: string]: { donations: number; expenses: number; receivable: number } } = {};
    
    // Process donations by month
    donationsData.forEach((donation: any) => {
      const date = new Date(donation.donationDate || donation.createdAt);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { donations: 0, expenses: 0, receivable: 0 };
      }
      monthlyGroups[monthKey].donations += parseFloat(donation.amount || 0);
    });

    // Process accounts payable by month
    payableData.forEach((account: any) => {
      const date = new Date(account.dueDate || account.createdAt);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { donations: 0, expenses: 0, receivable: 0 };
      }
      monthlyGroups[monthKey].expenses += parseFloat(account.amount || 0);
    });

    // Process accounts receivable by month
    receivableData.forEach((account: any) => {
      const date = new Date(account.dueDate || account.createdAt);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { donations: 0, expenses: 0, receivable: 0 };
      }
      monthlyGroups[monthKey].receivable += parseFloat(account.amount || 0);
    });

    // Convert to chart format
    const monthlyData = Object.keys(monthlyGroups).map(month => ({
      month,
      donations: monthlyGroups[month].donations,
      expenses: monthlyGroups[month].expenses,
      receivable: monthlyGroups[month].receivable,
      balance: monthlyGroups[month].donations + monthlyGroups[month].receivable - monthlyGroups[month].expenses
    })).slice(-6); // Last 6 months

    // Generate expense categories from real data
    const expensesByCategory: { [key: string]: number } = {};
    payableData.forEach((account: any) => {
      const category = account.category || 'Outros';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(account.amount || 0);
    });

    const expenseCategories = Object.keys(expensesByCategory).map((category, index) => ({
      name: category,
      value: expensesByCategory[category],
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'][index % 6]
    }));

    // Generate donation sources from real data
    const donationsBySource: { [key: string]: number } = {};
    donationsData.forEach((donation: any) => {
      const source = donation.campaignSource || 'Outros';
      donationsBySource[source] = (donationsBySource[source] || 0) + parseFloat(donation.amount || 0);
    });

    const donationSources = Object.keys(donationsBySource).map((source, index) => ({
      name: source,
      value: donationsBySource[source],
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'][index % 6]
    }));

    return {
      monthlyData,
      expenseCategories,
      donationSources
    };
  }, [financialMetrics]);

  const handleRefreshData = () => {
    refetchDonations();
    refetchReceivable();
    refetchPayable();
  };

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
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalDonations)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Dados em tempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalReceivable)}</div>
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
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalPayable)}</div>
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
            <div className={`text-2xl font-bold ${financialMetrics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(financialMetrics.netBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.netBalance >= 0 ? 'Posição positiva' : 'Déficit'}
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
              <BarChart data={chartData.monthlyData}>
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
              Por categoria (dados em tempo real)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.expenseCategories.map((entry, index) => (
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
            Evolução do saldo ao longo do tempo (dados reais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyData}>
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
              Origem das doações recebidas (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.donationSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.donationSources.map((entry, index) => (
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
            <BarChart data={chartData.monthlyData}>
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
              {chartData.expenseCategories.map((category, index) => (
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
                      {chartData.expenseCategories.length > 0 ? 
                        ((category.value / chartData.expenseCategories.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(1) : 0}%
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
              Análise completa da situação financeira da organização • 
              <span className="inline-flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Dados em tempo real
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
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
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report Content */}
        {renderCurrentReport()}
      </div>
    </MainLayout>
  );
}