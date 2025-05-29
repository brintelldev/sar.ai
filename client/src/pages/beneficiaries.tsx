import { useState } from 'react';
import { Plus, Search, Filter, User, Shield, Calendar, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';
import { useBeneficiaries, useCreateBeneficiary } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

export default function Beneficiaries() {
  const { data: beneficiaries, isLoading } = useBeneficiaries();
  const createBeneficiary = useCreateBeneficiary();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newBeneficiary, setNewBeneficiary] = useState({
    registrationNumber: '',
    name: '',
    birthDate: '',
    document: '',
    contactInfo: {
      email: '',
      phone: '',
      alternativePhone: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    socialVulnerabilityData: {
      familyIncome: '',
      householdSize: '',
      vulnerabilities: [] as string[],
      notes: '',
    },
    consentRecords: {
      dataProcessing: false,
      communicationConsent: false,
      imageConsent: false,
    },
    dataRetentionUntil: '',
  });

  const handleCreateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate registration number
      const registrationNumber = `BEN-${Date.now().toString().slice(-6)}`;
      
      await createBeneficiary.mutateAsync({
        ...newBeneficiary,
        registrationNumber,
      });
      
      toast({
        title: 'Beneficiário cadastrado',
        description: 'O beneficiário foi cadastrado com sucesso.',
      });
      setIsCreateModalOpen(false);
      // Reset form
      setNewBeneficiary({
        registrationNumber: '',
        name: '',
        birthDate: '',
        document: '',
        contactInfo: {
          email: '',
          phone: '',
          alternativePhone: '',
        },
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
        socialVulnerabilityData: {
          familyIncome: '',
          householdSize: '',
          vulnerabilities: [],
          notes: '',
        },
        consentRecords: {
          dataProcessing: false,
          communicationConsent: false,
          imageConsent: false,
        },
        dataRetentionUntil: '',
      });
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar beneficiário',
        description: 'Não foi possível cadastrar o beneficiário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const filteredBeneficiaries = beneficiaries?.filter((beneficiary: any) =>
    beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    beneficiary.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    beneficiary.document?.includes(searchTerm)
  ) || [];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Beneficiários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os beneficiários da sua organização com conformidade LGPD
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Beneficiário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Beneficiário</DialogTitle>
              </DialogHeader>
              
              <Alert className="mb-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Este formulário está em conformidade com a LGPD. Todos os dados coletados são criptografados 
                  e utilizados apenas para fins de assistência social.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleCreateBeneficiary} className="space-y-6">
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={newBeneficiary.name}
                        onChange={(e) => setNewBeneficiary(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de nascimento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={newBeneficiary.birthDate}
                        onChange={(e) => setNewBeneficiary(prev => ({ ...prev, birthDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF/RG</Label>
                      <Input
                        id="document"
                        value={newBeneficiary.document}
                        onChange={(e) => setNewBeneficiary(prev => ({ ...prev, document: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newBeneficiary.contactInfo.email}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newBeneficiary.contactInfo.phone}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, phone: e.target.value }
                        }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Rua, número, complemento"
                        value={newBeneficiary.address.street}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Cidade"
                        value={newBeneficiary.address.city}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Estado"
                        value={newBeneficiary.address.state}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Contato de Emergência */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contato de Emergência</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Nome</Label>
                      <Input
                        id="emergencyName"
                        value={newBeneficiary.emergencyContact.name}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Parentesco</Label>
                      <Input
                        id="relationship"
                        value={newBeneficiary.emergencyContact.relationship}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        placeholder="Ex: Mãe, Pai, Irmão"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telefone</Label>
                      <Input
                        id="emergencyPhone"
                        value={newBeneficiary.emergencyContact.phone}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                {/* Vulnerabilidade Social */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Socioeconômicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="familyIncome">Renda familiar</Label>
                      <Input
                        id="familyIncome"
                        value={newBeneficiary.socialVulnerabilityData.familyIncome}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          socialVulnerabilityData: { 
                            ...prev.socialVulnerabilityData, 
                            familyIncome: e.target.value 
                          }
                        }))}
                        placeholder="Ex: 1-2 salários mínimos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="householdSize">Número de pessoas na família</Label>
                      <Input
                        id="householdSize"
                        type="number"
                        value={newBeneficiary.socialVulnerabilityData.householdSize}
                        onChange={(e) => setNewBeneficiary(prev => ({
                          ...prev,
                          socialVulnerabilityData: { 
                            ...prev.socialVulnerabilityData, 
                            householdSize: e.target.value 
                          }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações adicionais</Label>
                    <Textarea
                      id="notes"
                      value={newBeneficiary.socialVulnerabilityData.notes}
                      onChange={(e) => setNewBeneficiary(prev => ({
                        ...prev,
                        socialVulnerabilityData: { 
                          ...prev.socialVulnerabilityData, 
                          notes: e.target.value 
                        }
                      }))}
                      placeholder="Informações relevantes sobre a situação familiar"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Consentimentos LGPD */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Consentimentos (LGPD)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dataProcessing"
                        checked={newBeneficiary.consentRecords.dataProcessing}
                        onCheckedChange={(checked) =>
                          setNewBeneficiary(prev => ({
                            ...prev,
                            consentRecords: { ...prev.consentRecords, dataProcessing: checked }
                          }))
                        }
                      />
                      <Label htmlFor="dataProcessing" className="text-sm">
                        Consente com o processamento de dados pessoais para prestação de serviços *
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="communicationConsent"
                        checked={newBeneficiary.consentRecords.communicationConsent}
                        onCheckedChange={(checked) =>
                          setNewBeneficiary(prev => ({
                            ...prev,
                            consentRecords: { ...prev.consentRecords, communicationConsent: checked }
                          }))
                        }
                      />
                      <Label htmlFor="communicationConsent" className="text-sm">
                        Aceita receber comunicações da organização
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="imageConsent"
                        checked={newBeneficiary.consentRecords.imageConsent}
                        onCheckedChange={(checked) =>
                          setNewBeneficiary(prev => ({
                            ...prev,
                            consentRecords: { ...prev.consentRecords, imageConsent: checked }
                          }))
                        }
                      />
                      <Label htmlFor="imageConsent" className="text-sm">
                        Autoriza o uso de imagem para divulgação dos trabalhos da organização
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBeneficiary.isPending || !newBeneficiary.consentRecords.dataProcessing}
                  >
                    {createBeneficiary.isPending ? 'Salvando...' : 'Salvar beneficiário'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar beneficiários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Beneficiaries Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBeneficiaries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhum beneficiário encontrado' : 'Nenhum beneficiário cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros.'
                  : 'Comece cadastrando seu primeiro beneficiário para registrar os atendimentos.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Beneficiário
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBeneficiaries.map((beneficiary: any) => (
              <Card key={beneficiary.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{beneficiary.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {beneficiary.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">LGPD</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {beneficiary.birthDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {calculateAge(beneficiary.birthDate)} anos
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cadastrado em:</span>
                        <span className="text-muted-foreground">
                          {formatDate(beneficiary.createdAt)}
                        </span>
                      </div>
                      {beneficiary.dataRetentionUntil && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Retenção até:</span>
                          <span className="text-muted-foreground">
                            {formatDate(beneficiary.dataRetentionUntil)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Consent Status */}
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">Status de Consentimentos:</div>
                      <div className="flex flex-wrap gap-1">
                        {beneficiary.consentRecords?.dataProcessing && (
                          <Badge variant="secondary" className="text-xs">Dados</Badge>
                        )}
                        {beneficiary.consentRecords?.communicationConsent && (
                          <Badge variant="secondary" className="text-xs">Comunicação</Badge>
                        )}
                        {beneficiary.consentRecords?.imageConsent && (
                          <Badge variant="secondary" className="text-xs">Imagem</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm">
                      <FileText className="h-3 w-3 mr-1" />
                      Prontuário
                    </Button>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
