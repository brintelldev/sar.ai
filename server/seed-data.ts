import { storage } from './storage';
import bcrypt from 'bcrypt';

export async function seedTestData() {
  try {
    console.log('🌱 Iniciando população de dados de teste...');

    // 1. Criar primeira organização (ONG)
    const testOrg = await storage.createOrganization({
      name: 'Instituto Esperança',
      slug: 'instituto-esperanca',
      cnpj: '12.345.678/0001-90',
      email: 'contato@institutoesperanca.org.br',
      address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active'
    });

    console.log('✅ Organização criada:', testOrg.name);

    // 2. Criar usuários com diferentes níveis de acesso
    const adminUser = await storage.createUser({
      email: 'admin@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Maria Silva Santos',
      phone: '(11) 99999-1111'
    });

    const managerUser = await storage.createUser({
      email: 'gerente@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('gerente123', 10),
      name: 'João Carlos Oliveira',
      phone: '(11) 99999-2222'
    });

    const volunteerUser = await storage.createUser({
      email: 'voluntario@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('voluntario123', 10),
      name: 'Ana Paula Costa',
      phone: '(11) 99999-3333'
    });

    console.log('✅ Usuários criados');

    // 3. Atribuir roles aos usuários
    await storage.createUserRole({
      userId: adminUser.id,
      organizationId: testOrg.id,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      status: 'active'
    });

    await storage.createUserRole({
      userId: managerUser.id,
      organizationId: testOrg.id,
      role: 'project_manager',
      permissions: ['read', 'write'],
      status: 'active'
    });

    await storage.createUserRole({
      userId: volunteerUser.id,
      organizationId: testOrg.id,
      role: 'volunteer',
      permissions: ['read'],
      status: 'active'
    });

    console.log('✅ Roles atribuídos');

    // 4. Criar projetos
    const educationProject = await storage.createProject({
      organizationId: testOrg.id,
      name: 'Alfabetização Digital',
      description: 'Projeto para ensinar informática básica para crianças e adultos da comunidade',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-15'),
      budget: 50000,
      location: 'Centro Comunitário - Vila Nova',
      beneficiaryTarget: 'Crianças e adultos de 8 a 60 anos',
      expectedResults: 'Capacitar 200 pessoas em informática básica',
      responsibleUserId: managerUser.id
    });

    const healthProject = await storage.createProject({
      organizationId: testOrg.id,
      name: 'Saúde na Comunidade',
      description: 'Campanhas de saúde preventiva e atendimento básico',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-11-30'),
      budget: 75000,
      location: 'UBS - Jardim das Flores',
      beneficiaryTarget: 'Famílias em situação de vulnerabilidade',
      expectedResults: 'Atender 500 famílias com serviços de saúde preventiva',
      responsibleUserId: managerUser.id
    });

    console.log('✅ Projetos criados');

    // 5. Criar doadores
    const corporateDonor = await storage.createDonor({
      organizationId: testOrg.id,
      name: 'Empresa ABC Ltda',
      email: 'doacao@empresaabc.com.br',
      phone: '(11) 3333-4444',
      donorType: 'corporate',
      document: '98.765.432/0001-10',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      donationPreferences: ['educacao', 'saude'],
      communicationPreferences: ['email', 'telefone'],
      status: 'active'
    });

    const individualDonor = await storage.createDonor({
      organizationId: testOrg.id,
      name: 'Carlos Eduardo Ferreira',
      email: 'carlos.ferreira@email.com',
      phone: '(11) 99888-7777',
      donorType: 'individual',
      document: '123.456.789-00',
      address: 'Rua das Palmeiras, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02345-678',
      donationPreferences: ['educacao'],
      communicationPreferences: ['email'],
      status: 'active'
    });

    console.log('✅ Doadores criados');

    // 6. Criar beneficiários
    await storage.createBeneficiary({
      organizationId: testOrg.id,
      name: 'Fernanda Santos',
      cpf: '987.654.321-00',
      rg: '12.345.678-9',
      birthDate: new Date('1985-03-15'),
      email: 'fernanda.santos@email.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Acácias, 789',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '03456-789',
      familyIncome: 2500,
      familySize: 4,
      housingSituation: 'propria',
      education: 'ensino_medio_completo',
      profession: 'Auxiliar de limpeza',
      specialNeeds: '',
      status: 'active'
    });

    await storage.createBeneficiary({
      organizationId: testOrg.id,
      name: 'Roberto da Silva',
      cpf: '456.789.123-00',
      rg: '98.765.432-1',
      birthDate: new Date('1978-08-22'),
      email: 'roberto.silva@email.com',
      phone: '(11) 91234-5678',
      address: 'Rua dos Lírios, 321',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04567-890',
      familyIncome: 1800,
      familySize: 3,
      housingSituation: 'alugada',
      education: 'ensino_fundamental_completo',
      profession: 'Pedreiro',
      specialNeeds: '',
      status: 'active'
    });

    console.log('✅ Beneficiários criados');

    // 7. Criar voluntários
    await storage.createVolunteer({
      userId: volunteerUser.id,
      organizationId: testOrg.id,
      volunteerNumber: 'VOL-001',
      skills: ['Tecnologia', 'Educação', 'Comunicação'],
      availability: ['monday_morning', 'wednesday_afternoon', 'saturday_morning'],
      backgroundCheckStatus: 'approved',
      status: 'active',
      emergencyContact: {
        name: 'Pedro Costa',
        relationship: 'Esposo',
        phone: '(11) 99888-5555'
      },
      personalInfo: {
        name: 'Ana Paula Costa',
        email: 'voluntario@institutoesperanca.org.br',
        phone: '(11) 99999-3333',
        profession: 'Professora',
        experience: 'Experiência em projetos educacionais e ensino de informática',
        motivation: 'Desejo ajudar a comunidade através da educação e tecnologia'
      }
    });

    await storage.createVolunteer({
      userId: crypto.randomUUID(),
      organizationId: testOrg.id,
      volunteerNumber: 'VOL-002',
      skills: ['Saúde', 'Psicologia', 'Serviço Social'],
      availability: ['tuesday_morning', 'thursday_afternoon', 'friday_morning'],
      backgroundCheckStatus: 'approved',
      status: 'active',
      emergencyContact: {
        name: 'Lucia Mendes',
        relationship: 'Mãe',
        phone: '(11) 98765-1111'
      },
      personalInfo: {
        name: 'Rafael Mendes',
        email: 'rafael.mendes@email.com',
        phone: '(11) 97654-3210',
        profession: 'Psicólogo',
        experience: 'Trabalho voluntário em hospitais e ONGs de saúde mental',
        motivation: 'Contribuir para o bem-estar psicológico da comunidade'
      }
    });

    console.log('✅ Voluntários criados');

    // 8. Criar doações
    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: corporateDonor.id,
      projectId: educationProject.id,
      amount: 10000,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed',
      transactionId: 'TXN-001-2024',
      campaignSource: 'Site institucional',
      isRecurring: true,
      recurringFrequency: 'monthly',
      notes: 'Doação mensal para projeto de alfabetização digital'
    });

    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: individualDonor.id,
      projectId: healthProject.id,
      amount: 500,
      paymentMethod: 'pix',
      paymentStatus: 'completed',
      transactionId: 'PIX-002-2024',
      campaignSource: 'Redes sociais',
      isRecurring: false,
      recurringFrequency: '',
      notes: 'Doação única para campanha de saúde'
    });

    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: null,
      projectId: null,
      amount: 250,
      paymentMethod: 'pix',
      paymentStatus: 'completed',
      transactionId: 'PIX-003-2024',
      campaignSource: 'Evento beneficente',
      isRecurring: false,
      recurringFrequency: '',
      notes: 'Doação anônima durante evento'
    });

    console.log('✅ Doações criadas');

    console.log('🎉 Dados de teste populados com sucesso!');
    console.log('\n📝 Usuários de teste criados:');
    console.log('Admin: admin@institutoesperanca.org.br / admin123');
    console.log('Gerente: gerente@institutoesperanca.org.br / gerente123');
    console.log('Voluntário: voluntario@institutoesperanca.org.br / voluntario123');

  } catch (error) {
    console.error('❌ Erro ao popular dados de teste:', error);
    throw error;
  }
}