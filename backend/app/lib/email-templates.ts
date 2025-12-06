// Plantillas de email para autenticación

export const confirmationEmailTemplate = (
  userName: string,
  confirmationLink: string
) => ({
  subject: 'Confirma tu cuenta - Parroquia',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✝️ Bienvenido a la Parroquia</h1>
          </div>
          <div class="content">
            <p>Hola ${userName},</p>
            <p>Gracias por registrarte en nuestra aplicación parroquial. Para completar tu registro, confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
            <div style="text-align: center;">
              <a href="${confirmationLink}" class="button">Confirmar mi cuenta</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
            <p style="color: #6b7280; font-size: 14px;">Este enlace expirará en 24 horas.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Parroquia. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});

export const passwordResetEmailTemplate = (
  userName: string,
  resetLink: string
) => ({
  subject: 'Recupera tu contraseña - Parroquia',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperar Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola ${userName},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Restablecer contraseña</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.</p>
            <p style="color: #6b7280; font-size: 14px;">Este enlace expirará en 1 hora.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Parroquia. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});

export const welcomeEmailTemplate = (userName: string) => ({
  subject: '¡Bienvenido a la comunidad parroquial! ✝️',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Tu cuenta está confirmada!</h1>
          </div>
          <div class="content">
            <p>Hola ${userName},</p>
            <p>Tu cuenta ha sido confirmada con éxito. Ya puedes acceder a todas las funcionalidades de nuestra aplicación parroquial:</p>
            <ul>
              <li>📅 Consultar el calendario de eventos y misas</li>
              <li>💬 Chatear con nuestro asistente parroquial</li>
              <li>🙏 Enviar intenciones de oración</li>
              <li>📢 Recibir notificaciones importantes</li>
              <li>👥 Unirte a ministerios y grupos</li>
            </ul>
            <p>Estamos felices de tenerte en nuestra comunidad.</p>
            <p style="margin-top: 30px;">Que Dios te bendiga,<br><strong>Equipo Parroquial</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Parroquia. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});
