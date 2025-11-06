// Resend email service configuration
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not found in environment variables. Email sending will fail.');
}

export const resend = new Resend(RESEND_API_KEY);
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@resply.com';
