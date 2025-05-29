import { Shield, FileCheck, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function LGPDStatus() {
  // Mock LGPD compliance data - in real app this would come from API
  const lgpdData = {
    activeConsents: 98,
    totalDocuments: 156,
    updatedDocuments: 156,
    lastAudit: '15 Nov 2024',
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Status LGPD</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Consentimentos Ativos</span>
            <span className="text-sm font-medium text-foreground">{lgpdData.activeConsents}%</span>
          </div>
          <Progress value={lgpdData.activeConsents} className="h-2" />
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Documentos Atualizados</span>
            <span className="text-sm font-medium text-foreground">
              {lgpdData.updatedDocuments}/{lgpdData.totalDocuments}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Última Auditoria</span>
            <span className="text-sm font-medium text-foreground">{lgpdData.lastAudit}</span>
          </div>
          
          <div className="pt-2">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Shield className="h-4 w-4 mr-2" />
              Visualizar Relatório de Conformidade
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
