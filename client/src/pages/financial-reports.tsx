import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, BarChart3, PieChart } from 'lucide-react';

export default function FinancialReports() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">
              Gere relatórios detalhados da situação financeira da organização
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ 45.231,80</div>
              <p className="text-xs text-muted-foreground">
                Doações e parcerias
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
              <PieChart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ 22.140,00</div>
              <p className="text-xs text-muted-foreground">
                Custos operacionais
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">R$ 23.091,80</div>
              <p className="text-xs text-muted-foreground">
                Resultado do período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Doações
              </CardTitle>
              <CardDescription>
                Detalhamento completo das doações recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Inclui dados de doadores, valores, frequência e análise de tendências.
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fluxo de Caixa
              </CardTitle>
              <CardDescription>
                Entradas e saídas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Análise mensal das receitas e despesas com projeções futuras.
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Demonstrativo de Resultados
              </CardTitle>
              <CardDescription>
                Resumo financeiro consolidado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Balanço completo com receitas, despesas e resultado líquido.
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prestação de Contas
              </CardTitle>
              <CardDescription>
                Relatório para transparência e compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Documento formal para apresentação a órgãos reguladores e doadores.
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Módulo em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta funcionalidade está sendo desenvolvida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O sistema de relatórios financeiros está em desenvolvimento e será disponibilizado em breve. 
              Aqui você poderá gerar relatórios detalhados para acompanhamento e prestação de contas.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}