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
    <h1 style="color: white; margin: 0; font-size: 28px;">Resply</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Tu asistente de atención al cliente</p>
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
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
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
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
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
  <title>Bienvenido a Resply</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Resply!</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Tu asistente de atención al cliente</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">¡Hola ${userName}!</h2>

    <p>Gracias por unirte a nuestra plataforma. Estamos emocionados de ayudarte a mejorar tu atención al cliente con IA.</p>

    <p>Para activar tu cuenta y comenzar a disfrutar de todas las funcionalidades, por favor confirma tu correo electrónico:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Confirmar correo
      </a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">¿Qué puedes hacer con Resply?</h3>
    <ul style="color: #666; line-height: 1.8;">
      <li>💬 Chatbot IA para atención al cliente 24/7</li>
      <li>📚 Búsqueda inteligente en tu base de conocimientos</li>
      <li>📊 Dashboard con métricas y analíticas</li>
      <li>🔗 Integración con WhatsApp, Instagram y Facebook</li>
    </ul>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
¡Bienvenido a Resply!

Hola ${userName},

Gracias por unirte a nuestra plataforma. Estamos emocionados de ayudarte a mejorar tu atención al cliente con IA.

Para activar tu cuenta y comenzar a disfrutar de todas las funcionalidades, por favor confirma tu correo electrónico visitando:
${confirmUrl}

¿Qué puedes hacer con Resply?
- Chatbot IA para atención al cliente 24/7
- Búsqueda inteligente en tu base de conocimientos
- Dashboard con métricas y analíticas
- Integración con WhatsApp, Instagram y Facebook

Si no creaste esta cuenta, puedes ignorar este correo.

---
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
  `.trim();

  return { html, text };
};

export interface TeamInvitationEmailParams {
  inviterName: string;
  inviteeName: string;
  workspaceName: string;
  inviteUrl: string;
  role: string;
}

export const teamInvitationEmailTemplate = (params: TeamInvitationEmailParams): { html: string; text: string; subject: string } => {
  const { inviterName, inviteeName, workspaceName, inviteUrl, role } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a workspace</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Resply</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Tu asistente de atención al cliente</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">¡Hola ${inviteeName}!</h2>

    <p><strong>${inviterName}</strong> te ha invitado a unirte al workspace <strong>${workspaceName}</strong> en Resply.</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Detalles de la invitación:</strong></p>
      <ul style="margin: 0; padding-left: 20px; color: #666;">
        <li><strong>Workspace:</strong> ${workspaceName}</li>
        <li><strong>Rol asignado:</strong> ${role === 'admin' ? 'Administrador' : role === 'member' ? 'Miembro' : 'Viewer'}</li>
        <li><strong>Invitado por:</strong> ${inviterName}</li>
      </ul>
    </div>

    <p>Como miembro del equipo, podrás colaborar en la gestión de conversaciones, documentos y configuración del chatbot IA.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Aceptar invitación
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
      ${inviteUrl}
    </p>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Si no esperabas esta invitación, puedes ignorar este correo de forma segura.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
¡Hola ${inviteeName}!

${inviterName} te ha invitado a unirte al workspace "${workspaceName}" en Resply.

Detalles de la invitación:
- Workspace: ${workspaceName}
- Rol asignado: ${role === 'admin' ? 'Administrador' : role === 'member' ? 'Miembro' : 'Viewer'}
- Invitado por: ${inviterName}

Como miembro del equipo, podrás colaborar en la gestión de conversaciones, documentos y configuración del chatbot IA.

Para aceptar la invitación, visita:
${inviteUrl}

Si no esperabas esta invitación, puedes ignorar este correo de forma segura.

---
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
  `.trim();

  const subject = `${inviterName} te invitó a ${workspaceName} en Resply`;

  return { html, text, subject };
};

export interface ConversationNotificationEmailParams {
  userName: string;
  workspaceName: string;
  customerName: string;
  messagePreview: string;
  conversationUrl: string;
}

export const conversationNotificationEmailTemplate = (params: ConversationNotificationEmailParams): { html: string; text: string; subject: string } => {
  const { userName, workspaceName, customerName, messagePreview, conversationUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo mensaje</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💬 Nuevo mensaje</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Resply - ${workspaceName}</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>

    <p>Has recibido un nuevo mensaje de <strong>${customerName}</strong> en tu workspace <strong>${workspaceName}</strong>.</p>

    <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #666; font-style: italic;">
        "${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"
      </p>
    </div>

    <p>Responde rápidamente para mantener una excelente experiencia de atención al cliente.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${conversationUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Ver conversación
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
      ${conversationUrl}
    </p>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Puedes configurar tus preferencias de notificaciones desde tu dashboard de Resply.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hola ${userName},

Has recibido un nuevo mensaje de ${customerName} en tu workspace "${workspaceName}".

Mensaje:
"${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"

Responde rápidamente para mantener una excelente experiencia de atención al cliente.

Ver conversación:
${conversationUrl}

Puedes configurar tus preferencias de notificaciones desde tu dashboard de Resply.

---
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
  `.trim();

  const subject = `Nuevo mensaje de ${customerName} - ${workspaceName}`;

  return { html, text, subject };
};

export interface DocumentProcessedEmailParams {
  userName: string;
  workspaceName: string;
  filename: string;
  documentsUrl: string;
}

export const documentProcessedEmailTemplate = (params: DocumentProcessedEmailParams): { html: string; text: string; subject: string } => {
  const { userName, workspaceName, filename, documentsUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento procesado</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Documento listo</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Resply - ${workspaceName}</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>

    <p>Tu documento se ha procesado exitosamente y ya está disponible para tu chatbot IA.</p>

    <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #666;"><strong>Documento procesado:</strong></p>
      <p style="margin: 0; color: #333; font-size: 16px;">📄 ${filename}</p>
    </div>

    <p>El contenido de este documento ahora forma parte de la base de conocimientos de tu workspace <strong>${workspaceName}</strong> y tu chatbot podrá usarlo para responder preguntas.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${documentsUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Ver mis documentos
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
      ${documentsUrl}
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hola ${userName},

Tu documento se ha procesado exitosamente y ya está disponible para tu chatbot IA.

Documento procesado:
📄 ${filename}

El contenido de este documento ahora forma parte de la base de conocimientos de tu workspace "${workspaceName}" y tu chatbot podrá usarlo para responder preguntas.

Ver mis documentos:
${documentsUrl}

---
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
  `.trim();

  const subject = `✅ Documento procesado: ${filename}`;

  return { html, text, subject };
};

export interface GdprExportReadyEmailParams {
  userName: string;
  downloadUrl: string;
  expiresIn: string;
}

export const gdprExportReadyEmailTemplate = (params: GdprExportReadyEmailParams): { html: string; text: string; subject: string } => {
  const { userName, downloadUrl, expiresIn } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exportación de datos lista</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📦 Tu exportación está lista</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Resply - Exportación de datos GDPR</p>
  </div>

  <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>

    <p>Tu exportación de datos personales está lista para descargar. Este archivo contiene toda la información que tenemos sobre ti según el Artículo 20 del GDPR (Derecho a la portabilidad de datos).</p>

    <div style="background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Importante:</strong> Este enlace de descarga expirará en <strong>${expiresIn}</strong> por razones de seguridad.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Descargar mis datos
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
      ${downloadUrl}
    </p>

    <h3 style="color: #333; margin-top: 30px;">¿Qué incluye esta exportación?</h3>
    <ul style="color: #666; line-height: 1.8;">
      <li>📊 Tu perfil y datos personales</li>
      <li>💬 Historial de conversaciones</li>
      <li>📄 Documentos subidos</li>
      <li>🏢 Información de workspaces</li>
      <li>📋 Registros de auditoría</li>
    </ul>

    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      Si no solicitaste esta exportación, por favor contacta con soporte inmediatamente.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Resply. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hola ${userName},

Tu exportación de datos personales está lista para descargar. Este archivo contiene toda la información que tenemos sobre ti según el Artículo 20 del GDPR (Derecho a la portabilidad de datos).

⚠️ IMPORTANTE: Este enlace de descarga expirará en ${expiresIn} por razones de seguridad.

Descargar mis datos:
${downloadUrl}

¿Qué incluye esta exportación?
- Tu perfil y datos personales
- Historial de conversaciones
- Documentos subidos
- Información de workspaces
- Registros de auditoría

Si no solicitaste esta exportación, por favor contacta con soporte inmediatamente.

---
© ${new Date().getFullYear()} Resply. Todos los derechos reservados.
  `.trim();

  const subject = `📦 Tu exportación de datos está lista - Resply`;

  return { html, text, subject };
};
