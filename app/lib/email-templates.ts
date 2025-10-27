// Email templates for the application

export interface PasswordResetEmailParams {
  userName: string;
  resetUrl: string;
}

export const passwordResetEmailTemplate = (params: PasswordResetEmailParams): { html: string; text: string } => {
  const { userName, resetUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">APP PARRO</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Tu guía espiritual</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>

    <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.</p>

    <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Restablecer contraseña
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
      ${resetUrl}
    </p>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Este enlace expirará en 1 hora por razones de seguridad.<br>
      Si no solicitaste este cambio, tu cuenta permanece segura.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} APP PARRO. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hola ${userName},

Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.

Para restablecer tu contraseña, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora por razones de seguridad.

Si no solicitaste este cambio, tu cuenta permanece segura.

---
© ${new Date().getFullYear()} APP PARRO. Todos los derechos reservados.
  `.trim();

  return { html, text };
};

export interface WelcomeEmailParams {
  userName: string;
  confirmUrl: string;
}

export const welcomeEmailTemplate = (params: WelcomeEmailParams): { html: string; text: string } => {
  const { userName, confirmUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a APP PARRO</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a APP PARRO!</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Tu guía espiritual diaria</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">¡Hola ${userName}!</h2>

    <p>Gracias por unirte a nuestra comunidad. Estamos emocionados de acompañarte en tu camino espiritual.</p>

    <p>Para activar tu cuenta y comenzar a disfrutar de todas las funcionalidades, por favor confirma tu correo electrónico:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Confirmar correo
      </a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">¿Qué puedes hacer con APP PARRO?</h3>
    <ul style="color: #666; line-height: 1.8;">
      <li>📖 Lee el evangelio y conoce al santo del día</li>
      <li>📅 Consulta los eventos y actividades de la parroquia</li>
      <li>💬 Chatea con nuestro asistente de IA para resolver dudas</li>
      <li>🔔 Recibe notificaciones de contenido espiritual diario</li>
    </ul>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} APP PARRO. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
¡Bienvenido a APP PARRO!

Hola ${userName},

Gracias por unirte a nuestra comunidad. Estamos emocionados de acompañarte en tu camino espiritual.

Para activar tu cuenta y comenzar a disfrutar de todas las funcionalidades, por favor confirma tu correo electrónico visitando:
${confirmUrl}

¿Qué puedes hacer con APP PARRO?
- Lee el evangelio y conoce al santo del día
- Consulta los eventos y actividades de la parroquia
- Chatea con nuestro asistente de IA para resolver dudas
- Recibe notificaciones de contenido espiritual diario

Si no creaste esta cuenta, puedes ignorar este correo.

---
© ${new Date().getFullYear()} APP PARRO. Todos los derechos reservados.
  `.trim();

  return { html, text };
};
