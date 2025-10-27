// Resend email service configuration
// Install with: npm install resend

// Mock implementation for development
// Replace with actual Resend client when ready to send emails
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@appparro.com';

// Mock resend client
export const resend = {
  emails: {
    send: async (params: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      text?: string;
    }) => {
      console.log('📧 Email would be sent:', {
        from: params.from,
        to: params.to,
        subject: params.subject,
      });

      // Return mock response
      return {
        id: `mock-email-${Date.now()}`,
        from: params.from,
        to: params.to,
        created_at: new Date().toISOString(),
      };
    },
  },
};

// To enable real email sending:
// 1. Install resend: npm install resend
// 2. Uncomment the code below and remove the mock above
// 3. Add RESEND_API_KEY to your .env file

/*
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not found in environment variables. Email sending will fail.');
}

export const resend = new Resend(RESEND_API_KEY);
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@appparro.com';
*/
