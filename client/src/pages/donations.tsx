import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp, Calendar, Heart } from 'lucide-react';

export default function Donations() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doações</h1>
            <p className="text-base text-muted-foreground">
              Gerencie as doações recebidas pela organização
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Doação
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.231,80</div>
              <p className="text-xs text-muted-foreground">
                +20.1% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doações este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doadores Ativos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">284</div>
              <p className="text-xs text-muted-foreground">
                +8 novos doadores
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Doação</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 290,07</div>
              <p className="text-xs text-muted-foreground">
                +5.2% média mensal
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Módulo em Desenvolvimento</CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Esta funcionalidade está sendo desenvolvida
                </CardDescription>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                O sistema de gestão de doações está em desenvolvimento e será disponibilizado em breve. 
                Aqui você poderá registrar, acompanhar e gerar relatórios de todas as doações recebidas.
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Funcionalidades Previstas</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Registro de doações recebidas</li>
                    <li>• Controle de doadores</li>
                    <li>• Emissão de recibos</li>
                    <li>• Relatórios financeiros</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Benefícios</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Transparência total</li>
                    <li>• Conformidade fiscal</li>
                    <li>• Análise de tendências</li>
                    <li>• Gestão eficiente</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}