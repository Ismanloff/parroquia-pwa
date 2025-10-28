import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTodayDate } from '@/lib/dayjs';

// Evangelio por defecto
const DEFAULT_GOSPEL = {
  cita: 'Evangelio del día',
  texto: 'La Palabra de Dios nos acompaña cada día. Consulta el Evangelio del día en la liturgia.',
  reflexion: 'Que la Palabra de Dios ilumine tu camino hoy.',
};

/**
 * GET /api/gospel/today
 * Devuelve el evangelio del día según el calendario litúrgico
 * Usa Supabase para obtener datos reales de la base de datos
 */
export async function GET(_request: NextRequest) {
  try {
    // Si Supabase no está configurado, devolver evangelio por defecto
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning default gospel');
      return NextResponse.json({
        success: true,
        date: getTodayDate(),
        gospel: DEFAULT_GOSPEL,
        source: 'default',
      });
    }

    const targetDate = getTodayDate(); // Formato: YYYY-MM-DD en timezone Europe/Madrid

    // Buscar evangelio del día en Supabase
    const { data, error } = await supabase
      .from('gospels')
      .select('*')
      .eq('date', targetDate)
      .single();

    if (error) {
      // Si es error PGRST116, significa que no hay datos para este día
      if (error.code === 'PGRST116') {
        console.log(`No gospel found for ${targetDate}, returning default`);
        return NextResponse.json({
          success: true,
          date: targetDate,
          gospel: DEFAULT_GOSPEL,
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
        gospel: DEFAULT_GOSPEL,
        source: 'default',
      });
    }

    // Datos encontrados en Supabase
    return NextResponse.json({
      success: true,
      date: targetDate,
      gospel: {
        cita: (data as any).passage || 'Sin referencia',
        texto: (data as any).content || 'No disponible',
        reflexion: (data as any).title || null,
      },
      source: 'supabase',
    });
  } catch (error) {
    console.error('Error en /api/gospel/today:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el evangelio del día',
        gospel: DEFAULT_GOSPEL,
        source: 'error',
      },
      { status: 500 }
    );
  }
}
