import jsPDF from 'jspdf';

export interface CertificateData {
  userName: string;
  courseName: string;
  courseCategory: string;
  completionDate: string;
  certificateNumber: string;
  organizationName: string;
  courseHours: number;
  overallScore?: number;
  passScore?: number;
  verificationCode?: string;
  customTemplate?: string;
  studentCpf?: string;
  startDate?: string;
  instructorName?: string;
  instructorTitle?: string;
  city?: string;
  issueDate?: string;
}

// Função para substituir variáveis no template
const replaceTemplateVariables = (template: string, data: CertificateData): string => {
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return template
    .replace(/\{\{organizationName\}\}/g, data.organizationName)
    .replace(/\{\{studentName\}\}/g, data.userName)
    .replace(/\{\{studentCpf\}\}/g, data.studentCpf || 'Não informado')
    .replace(/\{\{courseTitle\}\}/g, data.courseName)
    .replace(/\{\{courseDuration\}\}/g, data.courseHours.toString())
    .replace(/\{\{startDate\}\}/g, data.startDate || 'Não informado')
    .replace(/\{\{completionDate\}\}/g, data.completionDate)
    .replace(/\{\{grade\}\}/g, data.overallScore?.toString() || '100')
    .replace(/\{\{certificateId\}\}/g, data.certificateNumber)
    .replace(/\{\{instructorName\}\}/g, data.instructorName || 'Equipe de Capacitação')
    .replace(/\{\{instructorTitle\}\}/g, data.instructorTitle || 'Instrutor(a)')
    .replace(/\{\{issueDate\}\}/g, data.issueDate || formatDate(today))
    .replace(/\{\{city\}\}/g, data.city || 'São Paulo');
};

// Função para gerar PDF com template personalizado
const generateCustomTemplatePDF = (certificateData: CertificateData): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Configurações de cores
  const primaryColor = '#2563eb';
  const goldColor = '#f59e0b';

  // Bordas decorativas
  pdf.setLineWidth(3);
  pdf.setDrawColor(primaryColor);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  pdf.setLineWidth(1);
  pdf.setDrawColor(goldColor);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Processar template personalizado
  const processedTemplate = replaceTemplateVariables(
    certificateData.customTemplate || '', 
    certificateData
  );

  // Dividir o texto em linhas
  const lines = processedTemplate.split('\n');
  const startY = 40;
  let currentY = startY;

  pdf.setTextColor('#333333');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      currentY += 8; // Espaço para linha em branco
      return;
    }

    // Título "CERTIFICADO"
    if (trimmedLine.toUpperCase() === 'CERTIFICADO') {
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor);
      const textWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - textWidth) / 2, currentY);
      
      // Linha decorativa
      pdf.setLineWidth(2);
      pdf.setDrawColor(goldColor);
      pdf.line((pageWidth - textWidth) / 2, currentY + 5, (pageWidth + textWidth) / 2, currentY + 5);
      
      currentY += 25;
      return;
    }

    // Nome do estudante (detectar se é o nome)
    if (trimmedLine === certificateData.userName) {
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor);
      const textWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - textWidth) / 2, currentY);
      
      // Linha decorativa abaixo do nome
      pdf.setLineWidth(1);
      pdf.setDrawColor(goldColor);
      pdf.line((pageWidth - textWidth) / 2, currentY + 5, (pageWidth + textWidth) / 2, currentY + 5);
      
      currentY += 20;
      return;
    }

    // Nome do curso (detectar se é o nome do curso)
    if (trimmedLine.includes(certificateData.courseName)) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryColor);
      const textWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - textWidth) / 2, currentY);
      currentY += 15;
      return;
    }

    // Assinatura (linhas com underscores)
    if (trimmedLine.includes('___')) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor('#666666');
      const textWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - textWidth) / 2, currentY);
      currentY += 12;
      return;
    }

    // Texto normal
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#333333');
    
    // Centralizar o texto
    const textWidth = pdf.getTextWidth(trimmedLine);
    pdf.text(trimmedLine, (pageWidth - textWidth) / 2, currentY);
    currentY += 12;
  });

  // Número do certificado no rodapé
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#666666');
  const certNumText = `Certificado Nº: ${certificateData.certificateNumber}`;
  pdf.text(certNumText, 20, pageHeight - 25);

  // Código de verificação (se disponível)
  if (certificateData.verificationCode) {
    const verificationText = `Código de Verificação: ${certificateData.verificationCode}`;
    const verificationWidth = pdf.getTextWidth(verificationText);
    pdf.text(verificationText, pageWidth - verificationWidth - 20, pageHeight - 25);
  }

  // Gerar nome do arquivo
  const fileName = `certificado_${certificateData.userName.replace(/\s+/g, '_').toLowerCase()}_${certificateData.certificateNumber}.pdf`;

  // Fazer o download do PDF
  pdf.save(fileName);
};

// Função padrão que usa template personalizado se disponível
export const generateCertificatePDF = (certificateData: CertificateData): void => {
  // Se há template personalizado, usar função personalizada
  if (certificateData.customTemplate && certificateData.customTemplate.trim()) {
    generateCustomTemplatePDF(certificateData);
    return;
  }

  // Usar design padrão se não há template personalizado
  generateDefaultCertificatePDF(certificateData);
};

// Função com o design padrão original
const generateDefaultCertificatePDF = (certificateData: CertificateData): void => {
  // Criar nova instância do PDF em modo paisagem (landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Configurações de cores
  const primaryColor = '#2563eb'; // Azul
  const goldColor = '#f59e0b'; // Dourado
  const grayColor = '#6b7280'; // Cinza

  // Dimensões da página (A4 landscape)
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Configurar cores e bordas decorativas
  pdf.setLineWidth(3);
  pdf.setDrawColor(primaryColor);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  pdf.setLineWidth(1);
  pdf.setDrawColor(goldColor);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Título principal "CERTIFICADO"
  pdf.setFontSize(36);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'CERTIFICADO';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 50);

  // Linha decorativa abaixo do título
  pdf.setLineWidth(2);
  pdf.setDrawColor(goldColor);
  pdf.line((pageWidth - titleWidth) / 2, 55, (pageWidth + titleWidth) / 2, 55);

  // Texto "Certificamos que"
  pdf.setFontSize(16);
  pdf.setTextColor(grayColor);
  pdf.setFont('helvetica', 'normal');
  const certifyText = 'Certificamos que';
  const certifyWidth = pdf.getTextWidth(certifyText);
  pdf.text(certifyText, (pageWidth - certifyWidth) / 2, 75);

  // Nome do usuário (destaque)
  pdf.setFontSize(28);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  const nameWidth = pdf.getTextWidth(certificateData.userName);
  pdf.text(certificateData.userName, (pageWidth - nameWidth) / 2, 95);

  // Linha decorativa abaixo do nome
  pdf.setLineWidth(1);
  pdf.setDrawColor(goldColor);
  pdf.line((pageWidth - nameWidth) / 2, 100, (pageWidth + nameWidth) / 2, 100);

  // Texto "concluiu com êxito o curso"
  pdf.setFontSize(16);
  pdf.setTextColor(grayColor);
  pdf.setFont('helvetica', 'normal');
  const completedText = 'concluiu com êxito o curso';
  const completedWidth = pdf.getTextWidth(completedText);
  pdf.text(completedText, (pageWidth - completedWidth) / 2, 115);

  // Nome do curso
  pdf.setFontSize(22);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  const courseWidth = pdf.getTextWidth(certificateData.courseName);
  pdf.text(certificateData.courseName, (pageWidth - courseWidth) / 2, 135);

  // Categoria do curso
  pdf.setFontSize(14);
  pdf.setTextColor(grayColor);
  pdf.setFont('helvetica', 'italic');
  const categoryText = `Categoria: ${certificateData.courseCategory}`;
  const categoryWidth = pdf.getTextWidth(categoryText);
  pdf.text(categoryText, (pageWidth - categoryWidth) / 2, 150);

  // Informações do curso (carga horária e desempenho)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  let courseInfoY = 170;
  
  // Carga horária
  const hoursText = `Carga Horária: ${certificateData.courseHours} horas`;
  const hoursWidth = pdf.getTextWidth(hoursText);
  pdf.text(hoursText, (pageWidth - hoursWidth) / 2, courseInfoY);
  
  // Desempenho (se disponível)
  if (certificateData.overallScore && certificateData.passScore) {
    courseInfoY += 15;
    const scoreText = `Aproveitamento: ${certificateData.overallScore}% (Nota mínima: ${certificateData.passScore}%)`;
    const scoreWidth = pdf.getTextWidth(scoreText);
    pdf.text(scoreText, (pageWidth - scoreWidth) / 2, courseInfoY);
  }

  // Data de conclusão
  courseInfoY += 20;
  const dateText = `Concluído em ${certificateData.completionDate}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, (pageWidth - dateWidth) / 2, courseInfoY);

  // Área de assinatura e organização
  const signatureY = pageHeight - 60;
  
  // Nome da organização
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor);
  const orgWidth = pdf.getTextWidth(certificateData.organizationName);
  pdf.text(certificateData.organizationName, (pageWidth - orgWidth) / 2, signatureY);

  // Linha para assinatura
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(grayColor);
  pdf.line((pageWidth - orgWidth) / 2, signatureY + 5, (pageWidth + orgWidth) / 2, signatureY + 5);

  // Número do certificado
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayColor);
  const certNumText = `Certificado Nº: ${certificateData.certificateNumber}`;
  pdf.text(certNumText, 20, pageHeight - 25);

  // Código de verificação (se disponível)
  if (certificateData.verificationCode) {
    const verificationText = `Código de Verificação: ${certificateData.verificationCode}`;
    const verificationWidth = pdf.getTextWidth(verificationText);
    pdf.text(verificationText, pageWidth - verificationWidth - 20, pageHeight - 25);
  }

  // Gerar nome do arquivo
  const fileName = `certificado_${certificateData.userName.replace(/\s+/g, '_').toLowerCase()}_${certificateData.certificateNumber}.pdf`;

  // Fazer o download do PDF
  pdf.save(fileName);
};