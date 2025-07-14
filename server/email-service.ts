// Brevo (antigo Sendinblue) Email Service
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com';
const FROM_NAME = process.env.FROM_NAME || 'Sar.ai';

// Configuração da API do Brevo
let brevoConfigured = false;

if (BREVO_API_KEY) {
  brevoConfigured = true;
  console.log('📧 Brevo configurado com sucesso');
} else {
  console.warn('⚠️ BREVO_API_KEY não configurado - emails não serão enviados');
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

async function sendBrevoEmail(params: EmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY não configurado');
    return false;
  }

  try {
    console.log('📧 Enviando email via Brevo API...');
    console.log('Para:', params.to);
    console.log('Assunto:', params.subject);
    
    const requestBody = {
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      to: [
        {
          email: params.to,
        },
      ],
      subject: params.subject,
      htmlContent: params.html || `<html><body>${params.text}</body></html>`,
    };

    console.log('📤 Payload enviado:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
        'accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro na resposta da API Brevo:', response.status, errorData);
      return false;
    }

    const data = await response.json();
    console.log(`📧 Email enviado com sucesso via Brevo para: ${params.to}`, data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email via Brevo:', error);
    return false;
  }
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Se não há configuração de email, apenas logga o conteúdo para desenvolvimento
  if (!brevoConfigured || !BREVO_API_KEY) {
    console.log('\n📧 EMAIL SIMULADO (Configure BREVO_API_KEY para envio real):');
    console.log(`Para: ${params.to}`);
    console.log(`Assunto: ${params.subject}`);
    console.log(`Conteúdo: ${params.text || params.html}`);
    console.log('────────────────────────────────────────────────────────\n');
    return true; // Simula sucesso para desenvolvimento
  }

  return await sendBrevoEmail(params);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  return await sendEmail({
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

export async function isEmailServiceConfigured(): Promise<boolean> {
  return brevoConfigured && !!BREVO_API_KEY;
}