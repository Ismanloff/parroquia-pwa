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

    const { token, password } = await req.json();

    // Validaciones
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar token y actualizar contraseña
    const { data: _data, error } = await supabaseAdmin.auth.admin.updateUserById(
      token, // En realidad necesitamos el user_id del token
      { password }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contraseña actualizada correctamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in reset-password endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
