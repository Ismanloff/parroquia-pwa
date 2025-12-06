import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { confirmationEmailTemplate } from '@/app/lib/email-templates';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone } = await req.json();

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Crear usuario en auth.users (email confirmado automáticamente para apps móviles)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email confirmado automáticamente (mejor UX para móvil)
      user_metadata: {
        full_name: fullName || '',
        phone: phone || '',
      },
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: authError.message || 'Error al crear usuario' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      );
    }

    // El perfil se crea automáticamente por el trigger de Supabase
    // (handle_new_user trigger en auth.users)

    // Email confirmado automáticamente - enviar email de bienvenida (opcional)
    // Puedes descomentar esto para enviar un email de bienvenida:
    /*
    try {
      const welcomeEmail = welcomeEmailTemplate(fullName || email.split('@')[0]);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }
    */

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente. Ya puedes iniciar sesión.',
        userId: authData.user.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in register endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
