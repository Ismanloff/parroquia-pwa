import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTodayDate } from '@/lib/dayjs';

// Evangelio por defecto
const DEFAULT_GOSPEL = {
  cita: 'Lucas 1, 39-45',
  texto:
    'En aquellos días, María se puso en camino y fue aprisa a la montaña, a un pueblo de Judá; entró en casa de Zacarías y saludó a Isabel. En cuanto Isabel oyó el saludo de María, saltó la criatura en su vientre. Se llenó Isabel del Espíritu Santo y dijo a voz en grito: "¡Bendita tú entre las mujeres, y bendito el fruto de tu vientre! ¿Quién soy yo para que me visite la madre de mi Señor? En cuanto tu saludo llegó a mis oídos, la criatura saltó de alegría en mi vientre. Bienaventurada la que ha creído, porque lo que le ha dicho el Señor se cumplirá".',
  reflexion:
    'María nos enseña a compartir la alegría de la fe visitando a quienes más lo necesitan.',
};

interface GospelRecord {
  passage?: string;
  content?: string;
  title?: string;
  date?: string;
}

/**
 * GET /api/gospel/today
 * Devuelve el evangelio del día según el calendario litúrgico
 * Usa Supabase para obtener datos reales de la base de datos
 */
export async function GET(_request: NextRequest) {
  const targetDate = getTodayDate(); // Formato: YYYY-MM-DD en timezone Europe/Madrid

  try {
    // Si Supabase no está configurado, devolver evangelio por defecto
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        gospel: DEFAULT_GOSPEL,
        source: 'default',
      });
    }

    // Intentar buscar evangelio del día en Supabase
    const { data, error } = await supabase
      .from('gospels')
      .select('*')
      .eq('date', targetDate)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        date: targetDate,
        gospel: DEFAULT_GOSPEL,
        source: 'default',
      });
    }

    // Datos encontrados en Supabase
    const gospelData = data as GospelRecord;

    return NextResponse.json({
      success: true,
      date: targetDate,
      gospel: {
        cita: gospelData.passage || 'Sin referencia',
        texto: gospelData.content || 'No disponible',
        reflexion: gospelData.title || null,
      },
      source: 'supabase',
    });
  } catch (error) {
    console.error('Error en /api/gospel/today:', error);
    return NextResponse.json({
      success: true,
      date: targetDate,
      gospel: DEFAULT_GOSPEL,
      source: 'error',
    });
  }
}
