import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { email, password } = await req.json();

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Autenticar usuario
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);

      // Mensajes de error personalizados
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        );
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Por favor confirma tu email antes de iniciar sesión' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Error al iniciar sesión' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Error al iniciar sesión' },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          ...(profile || {}),
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in login endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
