import { useState } from 'react';
import { Plus, Search, Filter, UserCheck, Clock, Star, Mail, Phone, X, Tag } from 'lucide-react';
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
import { useVolunteers, useCreateVolunteer, useUpdateVolunteer } from '@/hooks/use-organization';
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
  const updateVolunteer = useUpdateVolunteer();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  
  // Estados para filtros
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    backgroundCheck: 'all',
    skills: [] as string[],
    availability: [] as string[]
  });
  
  // Estados para o sistema de tags dinâmicas
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editNewSkillInput, setEditNewSkillInput] = useState('');
  const [isAddingSkillEdit, setIsAddingSkillEdit] = useState(false);

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
        name: newVolunteer.personalInfo.name,
        email: newVolunteer.personalInfo.email,
        phone: newVolunteer.personalInfo.phone,
        userId: null, // No user account associated
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

  const handleViewVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsViewModalOpen(true);
  };

  const handleEditVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsEditModalOpen(true);
  };

  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteer) return;

    try {
      await updateVolunteer.mutateAsync({
        id: selectedVolunteer.id,
        data: {
          name: selectedVolunteer.name,
          email: selectedVolunteer.email,
          phone: selectedVolunteer.phone,
          skills: selectedVolunteer.skills,
          availability: selectedVolunteer.availability,
          backgroundCheckStatus: selectedVolunteer.backgroundCheckStatus,
          emergencyContact: selectedVolunteer.emergencyContact,
          status: selectedVolunteer.status,
        }
      });

      toast({
        title: 'Voluntário atualizado',
        description: 'As informações do voluntário foram atualizadas com sucesso.',
      });
      setIsEditModalOpen(false);
      setSelectedVolunteer(null);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar voluntário',
        description: 'Não foi possível atualizar o voluntário. Tente novamente.',
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

  const filteredVolunteers = volunteers?.filter((volunteer: any) => {
    // Filtro de busca por texto
    const matchesSearch = searchTerm === '' || 
      volunteer.volunteerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (volunteer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (volunteer.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por status
    const matchesStatus = filters.status === 'all' || volunteer.status === filters.status;

    // Filtro por verificação de antecedentes
    const matchesBackgroundCheck = filters.backgroundCheck === 'all' || 
      volunteer.backgroundCheckStatus === filters.backgroundCheck;

    // Filtro por habilidades
    const matchesSkills = filters.skills.length === 0 || 
      filters.skills.some(skill => volunteer.skills?.includes(skill));

    // Filtro por disponibilidade
    const matchesAvailability = filters.availability.length === 0 || 
      filters.availability.some(period => volunteer.availability?.includes(period));

    return matchesSearch && matchesStatus && matchesBackgroundCheck && matchesSkills && matchesAvailability;
  }) || [];

  const handleSkillToggle = (skill: string) => {
    setNewVolunteer(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Função para adicionar nova habilidade personalizada
  const handleAddCustomSkill = () => {
    const trimmedSkill = newSkillInput.trim();
    if (trimmedSkill && !getAllSkills().includes(trimmedSkill)) {
      setCustomSkills(prev => [...prev, trimmedSkill]);
      setNewVolunteer(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }));
      setNewSkillInput('');
      setIsAddingSkill(false);
      
      toast({
        title: 'Habilidade adicionada',
        description: `"${trimmedSkill}" foi adicionada à lista de habilidades.`,
      });
    }
  };

  // Função para remover habilidade personalizada
  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills(prev => prev.filter(s => s !== skill));
    setNewVolunteer(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Combinar habilidades padrão e customizadas
  const getAllSkills = () => [...skillsOptions, ...customSkills];

  // Funções para o modal de edição
  const handleAddCustomSkillEdit = () => {
    const trimmedSkill = editNewSkillInput.trim();
    if (trimmedSkill && !getAllSkills().includes(trimmedSkill)) {
      setCustomSkills(prev => [...prev, trimmedSkill]);
      const currentSkills = selectedVolunteer.skills || [];
      setSelectedVolunteer({
        ...selectedVolunteer,
        skills: [...currentSkills, trimmedSkill]
      });
      setEditNewSkillInput('');
      setIsAddingSkillEdit(false);
      
      toast({
        title: 'Habilidade adicionada',
        description: `"${trimmedSkill}" foi adicionada à lista de habilidades.`,
      });
    }
  };

  const handleSkillToggleEdit = (skill: string) => {
    const currentSkills = selectedVolunteer.skills || [];
    if (currentSkills.includes(skill)) {
      setSelectedVolunteer({
        ...selectedVolunteer,
        skills: currentSkills.filter((s: string) => s !== skill)
      });
    } else {
      setSelectedVolunteer({
        ...selectedVolunteer,
        skills: [...currentSkills, skill]
      });
    }
  };

  const handleAvailabilityToggle = (period: string) => {
    setNewVolunteer(prev => ({
      ...prev,
      availability: prev.availability.includes(period)
        ? prev.availability.filter(a => a !== period)
        : [...prev.availability, period]
    }));
  };

  // Funções para filtros
  const handleFilterSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleFilterAvailabilityToggle = (period: string) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(period)
        ? prev.availability.filter(a => a !== period)
        : [...prev.availability, period]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      backgroundCheck: 'all',
      skills: [],
      availability: []
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.backgroundCheck !== 'all') count++;
    if (filters.skills.length > 0) count++;
    if (filters.availability.length > 0) count++;
    return count;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Voluntários</h1>
            <p className="text-base text-muted-foreground">
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Habilidades e Competências</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSkill(true)}
                      className="gap-2"
                    >
                      <Tag className="h-4 w-4" />
                      Adicionar nova
                    </Button>
                  </div>

                  {/* Campo para adicionar nova habilidade */}
                  {isAddingSkill && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Input
                        placeholder="Digite uma nova habilidade..."
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomSkill}
                        disabled={!newSkillInput.trim()}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingSkill(false);
                          setNewSkillInput('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getAllSkills().map((skill) => {
                      const isCustom = customSkills.includes(skill);
                      return (
                        <div key={skill} className="flex items-center space-x-2 group">
                          <Checkbox
                            id={skill}
                            checked={newVolunteer.skills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <Label htmlFor={skill} className="text-sm flex-1 cursor-pointer">
                            {skill}
                          </Label>
                          {isCustom && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCustomSkill(skill)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Habilidades selecionadas */}
                  {newVolunteer.skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Habilidades selecionadas:</Label>
                      <div className="flex flex-wrap gap-2">
                        {newVolunteer.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleSkillToggle(skill)}
                          >
                            {skill}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar voluntários por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFilterOpen(true)}
              className={getActiveFiltersCount() > 0 ? "border-blue-500 text-blue-700 dark:text-blue-400" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
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
          <Card className="bg-white dark:bg-gray-800">
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
              <Card key={volunteer.id} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {volunteer.name || 'Nome não informado'}
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
                    {volunteer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">
                          {volunteer.email}
                        </span>
                      </div>
                    )}
                    
                    {volunteer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {volunteer.phone}
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
                    <Button variant="outline" size="sm" onClick={() => handleViewVolunteer(volunteer)}>
                      Ver Perfil
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditVolunteer(volunteer)}>
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Volunteer Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Perfil do Voluntário</DialogTitle>
            </DialogHeader>
            {selectedVolunteer && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Número</Label>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.volunteerNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefone</Label>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={`status-badge ${getStatusVariant(selectedVolunteer.status)}`}>
                      {getStatusLabel(selectedVolunteer.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Verificação</Label>
                    <Badge className={`status-badge ${getBackgroundCheckVariant(selectedVolunteer.backgroundCheckStatus)}`}>
                      {getBackgroundCheckLabel(selectedVolunteer.backgroundCheckStatus)}
                    </Badge>
                  </div>
                </div>

                {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Habilidades</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedVolunteer.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVolunteer.availability && selectedVolunteer.availability.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Disponibilidade</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedVolunteer.availability.map((slot: string) => (
                        <Badge key={slot} variant="outline">{availabilityOptions.find(opt => opt.id === slot)?.label || slot}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVolunteer.emergencyContact && (
                  <div>
                    <Label className="text-sm font-medium">Contato de Emergência</Label>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm text-muted-foreground">Nome: {selectedVolunteer.emergencyContact.name}</p>
                      <p className="text-sm text-muted-foreground">Relacionamento: {selectedVolunteer.emergencyContact.relationship}</p>
                      <p className="text-sm text-muted-foreground">Telefone: {selectedVolunteer.emergencyContact.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Volunteer Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Voluntário</DialogTitle>
            </DialogHeader>
            {selectedVolunteer && (
              <form onSubmit={handleUpdateVolunteer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome *</Label>
                    <Input
                      id="edit-name"
                      value={selectedVolunteer.name || ''}
                      onChange={(e) => setSelectedVolunteer({...selectedVolunteer, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedVolunteer.email || ''}
                      onChange={(e) => setSelectedVolunteer({...selectedVolunteer, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={selectedVolunteer.phone || ''}
                      onChange={(e) => setSelectedVolunteer({...selectedVolunteer, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={selectedVolunteer.status || 'pending'} 
                      onValueChange={(value) => setSelectedVolunteer({...selectedVolunteer, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilidades e Competências</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSkillEdit(true)}
                      className="gap-2"
                    >
                      <Tag className="h-4 w-4" />
                      Adicionar nova
                    </Button>
                  </div>

                  {/* Campo para adicionar nova habilidade no edit */}
                  {isAddingSkillEdit && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Input
                        placeholder="Digite uma nova habilidade..."
                        value={editNewSkillInput}
                        onChange={(e) => setEditNewSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkillEdit();
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomSkillEdit}
                        disabled={!editNewSkillInput.trim()}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingSkillEdit(false);
                          setEditNewSkillInput('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getAllSkills().map((skill) => {
                      const isCustom = customSkills.includes(skill);
                      return (
                        <div key={skill} className="flex items-center space-x-2 group">
                          <Checkbox
                            id={`edit-skill-${skill}`}
                            checked={selectedVolunteer.skills?.includes(skill) || false}
                            onCheckedChange={() => handleSkillToggleEdit(skill)}
                          />
                          <Label htmlFor={`edit-skill-${skill}`} className="text-sm flex-1 cursor-pointer">
                            {skill}
                          </Label>
                          {isCustom && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCustomSkill(skill)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Habilidades selecionadas no edit */}
                  {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Habilidades selecionadas:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedVolunteer.skills.map((skill: string) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleSkillToggleEdit(skill)}
                          >
                            {skill}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Disponibilidade */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Disponibilidade</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availabilityOptions.map((period) => (
                      <div key={period.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${period.id}`}
                          checked={selectedVolunteer.availability?.includes(period.id) || false}
                          onCheckedChange={(checked) => {
                            const currentAvailability = selectedVolunteer.availability || [];
                            if (checked) {
                              setSelectedVolunteer({
                                ...selectedVolunteer,
                                availability: [...currentAvailability, period.id]
                              });
                            } else {
                              setSelectedVolunteer({
                                ...selectedVolunteer,
                                availability: currentAvailability.filter((a: string) => a !== period.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`edit-${period.id}`} className="text-sm cursor-pointer">{period.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contato de Emergência */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Contato de Emergência</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-emergency-name">Nome</Label>
                      <Input
                        id="edit-emergency-name"
                        value={selectedVolunteer.emergencyContact?.name || ''}
                        onChange={(e) => setSelectedVolunteer({
                          ...selectedVolunteer,
                          emergencyContact: {
                            ...selectedVolunteer.emergencyContact,
                            name: e.target.value
                          }
                        })}
                        placeholder="Nome do contato"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-emergency-relationship">Parentesco</Label>
                      <Input
                        id="edit-emergency-relationship"
                        value={selectedVolunteer.emergencyContact?.relationship || ''}
                        onChange={(e) => setSelectedVolunteer({
                          ...selectedVolunteer,
                          emergencyContact: {
                            ...selectedVolunteer.emergencyContact,
                            relationship: e.target.value
                          }
                        })}
                        placeholder="Ex: Mãe, Pai, Esposo(a)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-emergency-phone">Telefone</Label>
                      <Input
                        id="edit-emergency-phone"
                        value={selectedVolunteer.emergencyContact?.phone || ''}
                        onChange={(e) => setSelectedVolunteer({
                          ...selectedVolunteer,
                          emergencyContact: {
                            ...selectedVolunteer.emergencyContact,
                            phone: e.target.value
                          }
                        })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateVolunteer.isPending}>
                    {updateVolunteer.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Filter Modal */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filtros Avançados</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Status do Voluntário</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Background Check Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Verificação de Antecedentes</Label>
                <Select value={filters.backgroundCheck} onValueChange={(value) => setFilters(prev => ({...prev, backgroundCheck: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a verificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as verificações</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skills Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Habilidades</Label>
                <p className="text-sm text-muted-foreground">Selecione as habilidades para filtrar voluntários</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {getAllSkills().map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-skill-${skill}`}
                        checked={filters.skills.includes(skill)}
                        onCheckedChange={() => handleFilterSkillToggle(skill)}
                      />
                      <Label htmlFor={`filter-skill-${skill}`} className="text-sm cursor-pointer">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.skills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Habilidades selecionadas:</Label>
                    <div className="flex flex-wrap gap-1">
                      {filters.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleFilterSkillToggle(skill)}
                        >
                          {skill}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Disponibilidade</Label>
                <p className="text-sm text-muted-foreground">Selecione os períodos de disponibilidade</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availabilityOptions.map((period) => (
                    <div key={period.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${period.id}`}
                        checked={filters.availability.includes(period.id)}
                        onCheckedChange={() => handleFilterAvailabilityToggle(period.id)}
                      />
                      <Label htmlFor={`filter-${period.id}`} className="text-sm cursor-pointer">
                        {period.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.availability.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Períodos selecionados:</Label>
                    <div className="flex flex-wrap gap-1">
                      {filters.availability.map((periodId) => {
                        const period = availabilityOptions.find(opt => opt.id === periodId);
                        return (
                          <Badge
                            key={periodId}
                            variant="outline"
                            className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleFilterAvailabilityToggle(periodId)}
                          >
                            {period?.label || periodId}
                            <X className="h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Todos os Filtros
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
