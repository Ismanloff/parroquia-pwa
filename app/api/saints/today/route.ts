import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTodayDate } from '@/lib/dayjs';

// Santo por defecto si no hay uno específico para el día
const DEFAULT_SAINT = {
  nombre: 'Santos del Día',
  descripcion: 'La Iglesia conmemora a los santos y bienaventurados de este día.',
};

/**
 * GET /api/saints/today
 * Devuelve el santo del día actual según el calendario litúrgico
 * Usa Supabase para obtener datos reales de la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    // Si Supabase no está configurado, devolver santo por defecto
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning default saint');
      return NextResponse.json({
        success: true,
        date: getTodayDate(),
        saint: DEFAULT_SAINT,
        source: 'default',
      });
    }

    const targetDate = getTodayDate(); // Formato: YYYY-MM-DD en timezone Europe/Madrid

    // Buscar santo del día en Supabase
    const { data, error } = await supabase
      .from('saints')
      .select('*')
      .eq('date', targetDate)
      .single();

    if (error) {
      // Si es error PGRST116, significa que no hay datos para este día
      if (error.code === 'PGRST116') {
        console.log(`No saint found for ${targetDate}, returning default`);
        return NextResponse.json({
          success: true,
          date: targetDate,
          saint: DEFAULT_SAINT,
          source: 'default',
        });
      }

      // Otro tipo de error
      console.error('Supabase error:', error);
      throw error;
    }

    // Verificar que hay datos
    if (!data) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        saint: DEFAULT_SAINT,
        source: 'default',
      });
    }

    // Datos encontrados en Supabase
    return NextResponse.json({
      success: true,
      date: targetDate,
      saint: {
        nombre: (data as any).name || 'Santos del día',
        descripcion: (data as any).bio || 'No disponible',
        imagen: null,
      },
      source: 'supabase',
    });
  } catch (error) {
    console.error('Error en /api/saints/today:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el santo del día',
        saint: DEFAULT_SAINT,
        source: 'error',
      },
      { status: 500 }
    );
  }
}
