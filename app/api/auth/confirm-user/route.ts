import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

// Endpoint para confirmar usuarios manualmente (solo para desarrollo/admin)
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Error al buscar usuario' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Confirmar email del usuario
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (error) {
      console.error('Error confirming user:', error);
      return NextResponse.json(
        { error: 'Error al confirmar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario confirmado correctamente',
        user: { id: data.user.id, email: data.user.email },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in confirm-user endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
