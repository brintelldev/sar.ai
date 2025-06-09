import { storage } from './storage';
import bcrypt from 'bcrypt';

export async function seedTestData() {
  try {
    console.log('🌱 Iniciando população de dados de teste...');

    // Verificar se já existem dados
    const existingOrg = await storage.getOrganizationBySlug('instituto-esperanca');
    if (existingOrg) {
      console.log('✅ Dados de teste já existem, pulando população');
      return;
    }

    // 1. Criar primeira organização (ONG)
    const testOrg = await storage.createOrganization({
      name: 'Instituto Esperança',
      slug: 'instituto-esperanca',
      cnpj: '12.345.678/0001-90',
      email: 'contato@institutoesperanca.org.br',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active'
    });

    console.log('✅ Organização criada:', testOrg.name);

    // 2. Criar usuários com diferentes níveis de acesso
    const adminUser = await storage.createUser({
      email: 'admin@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Maria Silva Santos'
    });

    const managerUser = await storage.createUser({
      email: 'gerente@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('gerente123', 10),
      name: 'João Carlos Oliveira'
    });

    const volunteerUser = await storage.createUser({
      email: 'voluntario@institutoesperanca.org.br',
      passwordHash: await bcrypt.hash('voluntario123', 10),
      name: 'Ana Paula Costa'
    });

    console.log('✅ Usuários criados');

    // 3. Atribuir roles aos usuários
    await storage.createUserRole({
      userId: adminUser.id,
      organizationId: testOrg.id,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      isActive: true
    });

    await storage.createUserRole({
      userId: managerUser.id,
      organizationId: testOrg.id,
      role: 'project_manager',
      permissions: ['read', 'write'],
      isActive: true
    });

    await storage.createUserRole({
      userId: volunteerUser.id,
      organizationId: testOrg.id,
      role: 'volunteer',
      permissions: ['read'],
      isActive: true
    });

    console.log('✅ Roles atribuídos');

    // 4. Criar projetos
    const educationProject = await storage.createProject({
      organizationId: testOrg.id,
      name: 'Alfabetização Digital',
      description: 'Projeto para ensinar informática básica para crianças e adultos da comunidade',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      budget: '50000',
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
      startDate: '2024-02-01',
      endDate: '2024-11-30',
      budget: '75000',
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
      type: 'corporate',
      email: 'doacao@empresaabc.com.br',
      phone: '(11) 3333-4444',
      address: {
        street: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100'
      },
      status: 'active'
    });

    const individualDonor = await storage.createDonor({
      organizationId: testOrg.id,
      name: 'Carlos Eduardo Ferreira',
      type: 'individual',
      email: 'carlos.ferreira@email.com',
      phone: '(11) 99888-7777',
      address: {
        street: 'Rua das Palmeiras, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02345-678'
      },
      status: 'active'
    });

    console.log('✅ Doadores criados');

    // 6. Criar beneficiários
    await storage.createBeneficiary({
      organizationId: testOrg.id,
      registrationNumber: 'BEN-001',
      name: 'Fernanda Santos',
      cpf: '987.654.321-00',
      rg: '12.345.678-9',
      birthDate: '1985-03-15',
      email: 'fernanda.santos@email.com',
      phone: '(11) 98765-4321',
      address: {
        street: 'Rua das Acácias, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '03456-789'
      },
      status: 'active'
    });

    await storage.createBeneficiary({
      organizationId: testOrg.id,
      registrationNumber: 'BEN-002',
      name: 'Roberto da Silva',
      cpf: '456.789.123-00',
      rg: '98.765.432-1',
      birthDate: '1978-08-22',
      email: 'roberto.silva@email.com',
      phone: '(11) 91234-5678',
      address: {
        street: 'Rua dos Lírios, 321',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567-890'
      },
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
      emergencyContact: {
        name: 'Pedro Costa',
        relationship: 'Esposo',
        phone: '(11) 99888-5555'
      }
    });

    await storage.createVolunteer({
      userId: crypto.randomUUID(),
      organizationId: testOrg.id,
      volunteerNumber: 'VOL-002',
      skills: ['Saúde', 'Psicologia', 'Serviço Social'],
      availability: ['tuesday_morning', 'thursday_afternoon', 'friday_morning'],
      backgroundCheckStatus: 'approved',
      emergencyContact: {
        name: 'Lucia Mendes',
        relationship: 'Mãe',
        phone: '(11) 98765-1111'
      }
    });

    console.log('✅ Voluntários criados');

    // 8. Criar doações
    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: corporateDonor.id,
      projectId: educationProject.id,
      amount: '10000',
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
      amount: '500',
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
      amount: '250',
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