import { useState } from 'react';
import { Plus, Search, Filter, UserCheck, Clock, Star, Mail, Phone } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import { useVolunteers, useCreateVolunteer } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

const skillsOptions = [
  'Administração', 'Contabilidade', 'Marketing', 'Comunicação', 'Design',
  'Tecnologia', 'Educação', 'Saúde', 'Psicologia', 'Serviço Social',
  'Direito', 'Culinária', 'Artesanato', 'Música', 'Esportes'
];

const availabilityOptions = [
  { id: 'monday_morning', label: 'Segunda - Manhã' },
  { id: 'monday_afternoon', label: 'Segunda - Tarde' },
  { id: 'tuesday_morning', label: 'Terça - Manhã' },
  { id: 'tuesday_afternoon', label: 'Terça - Tarde' },
  { id: 'wednesday_morning', label: 'Quarta - Manhã' },
  { id: 'wednesday_afternoon', label: 'Quarta - Tarde' },
  { id: 'thursday_morning', label: 'Quinta - Manhã' },
  { id: 'thursday_afternoon', label: 'Quinta - Tarde' },
  { id: 'friday_morning', label: 'Sexta - Manhã' },
  { id: 'friday_afternoon', label: 'Sexta - Tarde' },
  { id: 'saturday_morning', label: 'Sábado - Manhã' },
  { id: 'saturday_afternoon', label: 'Sábado - Tarde' },
];

export default function Volunteers() {
  const { data: volunteers, isLoading } = useVolunteers();
  const createVolunteer = useCreateVolunteer();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newVolunteer, setNewVolunteer] = useState({
    userId: '', // In real app, this would be created during user registration
    volunteerNumber: '',
    skills: [] as string[],
    availability: [] as string[],
    backgroundCheckStatus: 'pending',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      profession: '',
      experience: '',
      motivation: '',
    },
  });

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate volunteer number
      const volunteerNumber = `VOL-${Date.now().toString().slice(-6)}`;
      
      await createVolunteer.mutateAsync({
        ...newVolunteer,
        volunteerNumber,
        userId: crypto.randomUUID(), // In real app, this would be the actual user ID
      });
      
      toast({
        title: 'Voluntário cadastrado',
        description: 'O voluntário foi cadastrado com sucesso.',
      });
      setIsCreateModalOpen(false);
      // Reset form
      setNewVolunteer({
        userId: '',
        volunteerNumber: '',
        skills: [],
        availability: [],
        backgroundCheckStatus: 'pending',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          profession: '',
          experience: '',
          motivation: '',
        },
      });
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar voluntário',
        description: 'Não foi possível cadastrar o voluntário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'inactive':
        return 'status-warning';
      case 'suspended':
        return 'destructive';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  const getBackgroundCheckVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'destructive';
      default:
        return 'status-pending';
    }
  };

  const getBackgroundCheckLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const filteredVolunteers = volunteers?.filter((volunteer: any) =>
    volunteer.volunteerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (volunteer.personalInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSkillToggle = (skill: string) => {
    setNewVolunteer(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAvailabilityToggle = (period: string) => {
    setNewVolunteer(prev => ({
      ...prev,
      availability: prev.availability.includes(period)
        ? prev.availability.filter(a => a !== period)
        : [...prev.availability, period]
    }));
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Voluntários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os voluntários da sua organização
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Voluntário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Voluntário</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateVolunteer} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={newVolunteer.personalInfo.name}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, name: e.target.value }
                        }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newVolunteer.personalInfo.email}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={newVolunteer.personalInfo.phone}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profissão</Label>
                      <Input
                        id="profession"
                        value={newVolunteer.personalInfo.profession}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, profession: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Habilidades */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Habilidades e Competências</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skillsOptions.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={newVolunteer.skills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={skill} className="text-sm">{skill}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disponibilidade */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Disponibilidade</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availabilityOptions.map((period) => (
                      <div key={period.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={period.id}
                          checked={newVolunteer.availability.includes(period.id)}
                          onCheckedChange={() => handleAvailabilityToggle(period.id)}
                        />
                        <Label htmlFor={period.id} className="text-sm">{period.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experiência e Motivação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Experiência e Motivação</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experiência anterior com voluntariado</Label>
                      <Textarea
                        id="experience"
                        value={newVolunteer.personalInfo.experience}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, experience: e.target.value }
                        }))}
                        placeholder="Descreva sua experiência anterior com trabalho voluntário"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motivation">Motivação para ser voluntário</Label>
                      <Textarea
                        id="motivation"
                        value={newVolunteer.personalInfo.motivation}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, motivation: e.target.value }
                        }))}
                        placeholder="Por que você gostaria de ser voluntário da nossa organização?"
                        rows={3}
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
                        value={newVolunteer.emergencyContact.name}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Parentesco</Label>
                      <Input
                        id="relationship"
                        value={newVolunteer.emergencyContact.relationship}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        placeholder="Ex: Mãe, Pai, Esposo(a)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telefone</Label>
                      <Input
                        id="emergencyPhone"
                        value={newVolunteer.emergencyContact.phone}
                        onChange={(e) => setNewVolunteer(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createVolunteer.isPending}>
                    {createVolunteer.isPending ? 'Salvando...' : 'Salvar voluntário'}
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
              placeholder="Buscar voluntários..."
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

        {/* Volunteers Grid */}
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
        ) : filteredVolunteers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhum voluntário encontrado' : 'Nenhum voluntário cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros.'
                  : 'Comece cadastrando seu primeiro voluntário para organizar o trabalho da equipe.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Voluntário
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVolunteers.map((volunteer: any) => (
              <Card key={volunteer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {volunteer.personalInfo?.name || 'Nome não informado'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {volunteer.volunteerNumber}
                        </p>
                      </div>
                    </div>
                    <Badge className={`status-badge ${getStatusVariant(volunteer.status)}`}>
                      {getStatusLabel(volunteer.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {volunteer.personalInfo?.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {volunteer.personalInfo.email}
                        </span>
                      </div>
                    )}
                    
                    {volunteer.personalInfo?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {volunteer.personalInfo.phone}
                        </span>
                      </div>
                    )}

                    {/* Skills */}
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Habilidades:</div>
                        <div className="flex flex-wrap gap-1">
                          {volunteer.skills.slice(0, 3).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {volunteer.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{volunteer.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Horas trabalhadas:</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {volunteer.totalHours || 0}h
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Avaliação:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-muted-foreground">
                            {volunteer.participationScore || 0}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Background Check Status */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Verificação:</span>
                        <Badge 
                          className={`status-badge ${getBackgroundCheckVariant(volunteer.backgroundCheckStatus)} text-xs`}
                        >
                          {getBackgroundCheckLabel(volunteer.backgroundCheckStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm">
                      Ver Perfil
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
