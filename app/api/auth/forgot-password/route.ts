import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { passwordResetEmailTemplate } from '@/app/lib/email-templates';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { email } = await req.json();

    // Validaciones
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error checking user:', userError);
      // No revelar si el email existe o no por seguridad
      return NextResponse.json(
        {
          success: true,
          message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
        },
        { status: 200 }
      );
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      // No revelar si el email existe o no por seguridad
      return NextResponse.json(
        {
          success: true,
          message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
        },
        { status: 200 }
      );
    }

    // Obtener nombre del perfil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as { data: { full_name: string } | null };

    // Generar enlace de recuperación
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError || !resetData.properties?.action_link) {
      console.error('Error generating reset link:', resetError);
      return NextResponse.json(
        { error: 'Error al generar enlace de recuperación' },
        { status: 500 }
      );
    }

    // Enviar email de recuperación con Resend
    const userName = profile?.full_name || email.split('@')[0];
    const emailTemplate = passwordResetEmailTemplate({
      userName,
      resetUrl: resetData.properties.action_link
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Restablecer contraseña - APP PARRO',
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Revisa tu email para restablecer tu contraseña.',
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      return NextResponse.json(
        { error: 'Error al enviar el email de recuperación' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in forgot-password endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
