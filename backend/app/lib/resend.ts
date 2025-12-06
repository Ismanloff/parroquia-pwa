import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

// Inicialización lazy para no fallar durante el build
let _resend: Resend | null = null;

export const getResend = (): Resend => {
  if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }
  if (!_resend) {
    _resend = new Resend(resendApiKey);
  }
  return _resend;
};

// Export para compatibilidad (puede ser null durante build)
export const resend = resendApiKey ? new Resend(resendApiKey) : null as unknown as Resend;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Parroquia <noreply@parroquia.com>';
