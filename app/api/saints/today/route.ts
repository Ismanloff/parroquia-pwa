import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTodayDate } from '@/lib/dayjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Santo por defecto si no hay uno específico para el día
const DEFAULT_SAINT = {
  nombre: 'San Juan de la Cruz',
  descripcion:
    'Doctor de la Iglesia y uno de los grandes místicos españoles. Su poesía y escritos espirituales, como "Subida del Monte Carmelo" y "Noche Oscura del Alma", son obras maestras de la literatura mística universal.',
};

interface SaintRecord {
  name?: string;
  bio?: string;
  date?: string;
}

/**
 * GET /api/saints/today
 * Devuelve el santo del día actual según el calendario litúrgico
 * Usa Supabase para obtener datos reales de la base de datos
 */
export async function GET(_request: NextRequest) {
  const targetDate = getTodayDate(); // Formato: YYYY-MM-DD en timezone Europe/Madrid

  try {
    // Si Supabase no está configurado, devolver santo por defecto
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        saint: DEFAULT_SAINT,
        source: 'default',
      });
    }

    // Intentar buscar santo del día en Supabase
    const { data, error } = await supabase
      .from('saints')
      .select('*')
      .eq('date', targetDate)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        saint: DEFAULT_SAINT,
        source: 'default',
      });
    }

    // Datos encontrados en Supabase
    const saintData = data as SaintRecord;
    return NextResponse.json({
      success: true,
      date: targetDate,
      saint: {
        nombre: saintData.name || 'Santos del día',
        descripcion: saintData.bio || 'No disponible',
        imagen: null,
      },
      source: 'supabase',
    });
  } catch (error) {
    console.error('Error en /api/saints/today:', error);
    return NextResponse.json({
      success: true,
      date: targetDate,
      saint: DEFAULT_SAINT,
      source: 'error',
    });
  }
}
