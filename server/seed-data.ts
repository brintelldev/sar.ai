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

    // 6. Criar doações
    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: corporateDonor.id,
      projectId: educationProject.id,
      amount: '15000.00',
      currency: 'BRL',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed',
      campaignSource: 'Website corporativo',
      isRecurring: false,
      donationDate: '2024-03-01',
      notes: 'Doação direcionada para projeto de alfabetização digital'
    });

    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: individualDonor.id,
      amount: '500.00',
      currency: 'BRL',
      paymentMethod: 'pix',
      paymentStatus: 'completed',
      campaignSource: 'Instagram',
      isRecurring: true,
      recurringFrequency: 'monthly',
      donationDate: '2024-02-15',
      notes: 'Doação mensal via PIX'
    });

    await storage.createDonation({
      organizationId: testOrg.id,
      donorId: corporateDonor.id,
      projectId: healthProject.id,
      amount: '25000.00',
      currency: 'BRL',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed',
      campaignSource: 'Evento corporativo',
      isRecurring: false,
      donationDate: '2024-01-20',
      notes: 'Doação para projeto de saúde comunitária'
    });

    console.log('✅ Doações criadas');

    // 7. Criar beneficiários
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

    // 9. Criar cursos de capacitação
    const techCourse = await storage.createCourse({
      organizationId: testOrg.id,
      title: 'Capacitação em Tecnologia para ONGs - Curso Completo',
      description: 'Um curso abrangente que ensina organizações não governamentais a utilizarem tecnologia para maximizar seu impacto social. Aprenda sobre ferramentas digitais, gestão de dados, comunicação online e sistemas de gestão para ONGs.',
      category: 'tecnologia',
      level: 'intermediário',
      duration: 28800, // 8 horas em segundos
      requirements: 'Conhecimentos básicos de informática, acesso a computador com internet',
      learningObjectives: [
        'Compreender o papel da tecnologia no terceiro setor',
        'Implementar ferramentas digitais para gestão organizacional',
        'Desenvolver estratégias de comunicação digital eficazes',
        'Criar sistemas de monitoramento e avaliação baseados em dados',
        'Garantir segurança digital e proteção de dados sensíveis'
      ],
      tags: ['tecnologia', 'gestão', 'comunicação', 'dados', 'segurança'],
      passScore: 75,
      certificateEnabled: true,
      createdBy: adminUser.id,
      status: 'published'
    });

    // 10. Criar módulos do curso com vídeos e materiais
    const module1 = await storage.createCourseModule({
      courseId: techCourse.id,
      title: 'Introdução à Tecnologia para ONGs',
      description: 'Fundamentos da transformação digital no terceiro setor',
      duration: 7200, // 2 horas
      orderIndex: 1,
      content: {
        type: 'mixed',
        sections: [
          {
            type: 'video',
            title: 'O que é Transformação Digital para ONGs?',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 900 // 15 minutos
          },
          {
            type: 'text',
            title: 'Cenário Atual das ONGs no Brasil',
            content: 'Dados estatísticos sobre o uso de tecnologia em organizações do terceiro setor...'
          },
          {
            type: 'video',
            title: 'Casos de Sucesso: ONGs que se Transformaram',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1200 // 20 minutos
          }
        ]
      },
      resources: [
        {
          type: 'pdf',
          title: 'Guia de Introdução à Tecnologia para ONGs',
          url: '/materials/guia-introducao-tecnologia.pdf'
        },
        {
          type: 'link',
          title: 'Ferramentas Gratuitas para ONGs',
          url: 'https://example.com/ferramentas-gratuitas'
        }
      ],
      assessmentEnabled: true
    });

    const module2 = await storage.createCourseModule({
      courseId: techCourse.id,
      title: 'Ferramentas Digitais Essenciais',
      description: 'Principais ferramentas para gestão, comunicação e produtividade',
      duration: 7200,
      orderIndex: 2,
      content: {
        type: 'mixed',
        sections: [
          {
            type: 'video',
            title: 'Google Workspace para ONGs',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1800 // 30 minutos
          },
          {
            type: 'video',
            title: 'Trello e Asana: Gestão de Projetos',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1500 // 25 minutos
          },
          {
            type: 'practical',
            title: 'Exercício Prático: Criando seu Primeiro Projeto',
            instructions: 'Crie um projeto no Trello seguindo as instruções do vídeo...'
          }
        ]
      },
      resources: [
        {
          type: 'pdf',
          title: 'Lista de Ferramentas Recomendadas',
          url: '/materials/ferramentas-recomendadas.pdf'
        },
        {
          type: 'template',
          title: 'Template de Planejamento de Projeto',
          url: '/materials/template-projeto.xlsx'
        }
      ],
      assessmentEnabled: true
    });

    const module3 = await storage.createCourseModule({
      courseId: techCourse.id,
      title: 'Comunicação Digital e Redes Sociais',
      description: 'Estratégias de comunicação digital e presença online',
      duration: 7200,
      orderIndex: 3,
      content: {
        type: 'mixed',
        sections: [
          {
            type: 'video',
            title: 'Criando uma Estratégia de Comunicação Digital',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1200 // 20 minutos
          },
          {
            type: 'video',
            title: 'Instagram e Facebook para ONGs',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1800 // 30 minutos
          },
          {
            type: 'video',
            title: 'Criação de Conteúdo Visual com Canva',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1500 // 25 minutos
          }
        ]
      },
      resources: [
        {
          type: 'pdf',
          title: 'Calendário Editorial para ONGs',
          url: '/materials/calendario-editorial.pdf'
        },
        {
          type: 'template',
          title: 'Templates para Redes Sociais',
          url: '/materials/templates-redes-sociais.zip'
        }
      ],
      assessmentEnabled: true
    });

    const module4 = await storage.createCourseModule({
      courseId: techCourse.id,
      title: 'Gestão de Dados e Segurança Digital',
      description: 'Proteção de dados, LGPD e segurança digital para ONGs',
      duration: 7200,
      orderIndex: 4,
      content: {
        type: 'mixed',
        sections: [
          {
            type: 'video',
            title: 'LGPD para ONGs: O que Você Precisa Saber',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 2100 // 35 minutos
          },
          {
            type: 'video',
            title: 'Backup e Proteção de Dados',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 1200 // 20 minutos
          },
          {
            type: 'text',
            title: 'Políticas de Privacidade e Termos de Uso',
            content: 'Como criar e implementar políticas de privacidade adequadas...'
          }
        ]
      },
      resources: [
        {
          type: 'pdf',
          title: 'Checklist de Conformidade LGPD',
          url: '/materials/checklist-lgpd.pdf'
        },
        {
          type: 'template',
          title: 'Modelo de Política de Privacidade',
          url: '/materials/modelo-politica-privacidade.docx'
        }
      ],
      assessmentEnabled: true
    });

    console.log('✅ Curso e módulos criados');

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