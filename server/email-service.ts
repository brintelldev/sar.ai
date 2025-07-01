import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables. Email functionality will be disabled.');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Email sending failed: SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`✅ Email sent successfully to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error.response?.body || error.message);
    return false;
  }
}

export function generatePasswordResetEmail(userName: string, resetToken: string, organizationName: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const subject = `Redefinição de Senha - ${organizationName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Redefinição de Senha</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Redefinição de Senha</h1>
            </div>
            <div class="content">
                <p>Olá, <strong>${userName}</strong>!</p>
                
                <p>Você solicitou a redefinição de sua senha na plataforma <strong>${organizationName}</strong>.</p>
                
                <p>Para redefinir sua senha, clique no botão abaixo:</p>
                
                <p style="text-align: center;">
                    <a href="${resetUrl}" class="button">Redefinir Senha</a>
                </p>
                
                <p><strong>Importante:</strong></p>
                <ul>
                    <li>Este link é válido por apenas 1 hora</li>
                    <li>Se você não solicitou esta redefinição, ignore este email</li>
                    <li>Por segurança, não compartilhe este link com ninguém</li>
                </ul>
                
                <p>Se o botão acima não funcionar, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                    ${resetUrl}
                </p>
            </div>
            <div class="footer">
                <p>Este email foi enviado automaticamente pela plataforma ${organizationName}.</p>
                <p>Se você não solicitou esta redefinição, pode ignorar este email com segurança.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Olá, ${userName}!

Você solicitou a redefinição de sua senha na plataforma ${organizationName}.

Para redefinir sua senha, acesse o seguinte link:
${resetUrl}

IMPORTANTE:
- Este link é válido por apenas 1 hora
- Se você não solicitou esta redefinição, ignore este email
- Por segurança, não compartilhe este link com ninguém

Se você não solicitou esta redefinição, pode ignorar este email com segurança.

---
${organizationName}
  `.trim();

  return { subject, html, text };
}