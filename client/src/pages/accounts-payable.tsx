import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AccountsPayable() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contas a Pagar</h1>
            <p className="text-base text-muted-foreground">
              Gerencie despesas e obrigações financeiras da organização
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
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 18.750,00</div>
              <p className="text-xs text-muted-foreground">
                22 contas pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ 3.420,00</div>
              <p className="text-xs text-muted-foreground">
                3 contas vencidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Vencer (30 dias)</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">R$ 9.850,00</div>
              <p className="text-xs text-muted-foreground">
                12 contas próximas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago este Mês</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ 22.140,00</div>
              <p className="text-xs text-muted-foreground">
                18 pagamentos realizados
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
              O sistema de contas a pagar está em desenvolvimento e será disponibilizado em breve. 
              Aqui você poderá gerenciar todas as despesas operacionais, fornecedores e obrigações financeiras.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}