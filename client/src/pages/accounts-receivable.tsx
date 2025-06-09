import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowDown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AccountsReceivable() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contas a Receber</h1>
            <p className="text-base text-muted-foreground">
              Gerencie valores a receber de doadores e parcerias
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 28.450,00</div>
              <p className="text-xs text-muted-foreground">
                15 contas pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ 8.200,00</div>
              <p className="text-xs text-muted-foreground">
                5 contas vencidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Vencer (30 dias)</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">R$ 12.750,00</div>
              <p className="text-xs text-muted-foreground">
                7 contas próximas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido este Mês</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ 15.680,00</div>
              <p className="text-xs text-muted-foreground">
                12 pagamentos confirmados
              </p>
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
              O sistema de contas a receber está em desenvolvimento e será disponibilizado em breve. 
              Aqui você poderá gerenciar doações prometidas, contratos de parcerias e outros valores a receber.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}