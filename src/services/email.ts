import nodemailer from "nodemailer";

// Configuração do transporter
// Para desenvolvimento, use um serviço como Ethereal (https://ethereal.email)
// Para produção, configure com Gmail, SendGrid, AWS SES, etc.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // ✅ Corrige o secure automaticamente
  auth: {
    user: process.env.SMTP_USER || "seu-email@ethereal.email",
    pass: process.env.SMTP_PASS || "sua-senha",
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Minha Cidade" <${
        process.env.SMTP_USER || "noreply@minhacidade.com"
      }>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Email enviado:", info.messageId);

    // Para Ethereal, gera URL de preview
    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}

export function gerarEmailRecuperacaoSenha(nome: string, token: string) {
  const url = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/redefinir-senha?token=${token}`;

  return {
    subject: "Recuperação de Senha - Minha Cidade",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      🏛️ Minha Cidade
                    </h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                      Sistema de Gerenciamento de Chamados
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">
                      Olá, ${nome}!
                    </h2>

                    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>Minha Cidade</strong>.
                    </p>

                    <p style="color: #475569; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                      Para criar uma nova senha, clique no botão abaixo:
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                      <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                        <strong>⚠️ Atenção:</strong> Este link expira em <strong>1 hora</strong>.
                      </p>
                    </div>

                    <p style="color: #64748b; line-height: 1.6; margin: 0 0 10px 0; font-size: 14px;">
                      Ou copie e cole o link abaixo no seu navegador:
                    </p>

                    <p style="background-color: #f1f5f9; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #475569; margin: 0 0 30px 0;">
                      ${url}
                    </p>

                    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px;">
                      <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.5;">
                        <strong>🔒 Não solicitou esta alteração?</strong><br>
                        Se você não pediu para redefinir sua senha, ignore este email. Sua senha permanecerá a mesma.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">
                      Este é um email automático, por favor não responda.
                    </p>
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                      © 2025 Minha Cidade. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      Olá, ${nome}!

      Recebemos uma solicitação para redefinir a senha da sua conta no sistema Minha Cidade.

      Para criar uma nova senha, acesse o link abaixo:
      ${url}

      ⚠️ ATENÇÃO: Este link expira em 1 hora.

      🔒 Não solicitou esta alteração?
      Se você não pediu para redefinir sua senha, ignore este email. Sua senha permanecerá a mesma.

      ---
      Este é um email automático, por favor não responda.
      © 2025 Minha Cidade. Todos os direitos reservados.
    `,
  };
}
