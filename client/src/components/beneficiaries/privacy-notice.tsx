import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Lock, Eye } from 'lucide-react';

interface PrivacyNoticeProps {
  variant?: 'compact' | 'detailed';
}

export function PrivacyNotice({ variant = 'compact' }: PrivacyNoticeProps) {
  if (variant === 'compact') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Informações protegidas pela LGPD. Acesso restrito a pessoas autorizadas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Proteção de Dados Pessoais</AlertTitle>
        <AlertDescription className="text-blue-700">
          Este sistema cumpre integralmente a Lei Geral de Proteção de Dados (LGPD). 
          Todas as informações são criptografadas e acessíveis apenas por profissionais autorizados.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
          <Lock className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Dados Seguros</p>
            <p className="text-xs text-green-700">Criptografia de ponta a ponta</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
          <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-800">Acesso Controlado</p>
            <p className="text-xs text-purple-700">Apenas equipe autorizada</p>
          </div>
        </div>
      </div>
    </div>
  );
}