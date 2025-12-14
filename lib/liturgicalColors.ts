/**
 * Colores litúrgicos del año 2025-2026
 */

export type LiturgicalColor = 'purple' | 'green' | 'white' | 'red' | 'rose';

export interface LiturgicalSeason {
  name: string;
  color: LiturgicalColor;
  gradient: string[];
}

const liturgicalColors: Record<LiturgicalColor, string[]> = {
  purple: ['#6D28D9', '#4C1D95'], // Morado Profundo - Adviento y Cuaresma
  green: ['#10B981', '#059669'], // Verde - Tiempo Ordinario
  white: ['#F3F4F6', '#E5E7EB'], // Blanco - Navidad y Pascua
  red: ['#EF4444', '#DC2626'], // Rojo - Pentecostés, mártires
  rose: ['#F9A8D4', '#F472B6'], // Rosado - Gaudete y Laetare
};

/**
 * Determina el tiempo litúrgico y color según la fecha
 */
export function getLiturgicalSeason(date: Date): LiturgicalSeason {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  // Crear fecha en formato comparable
  const currentDate = new Date(year, month - 1, day);

  // AÑO 2025
  if (year === 2025) {
    // ADVIENTO 2025: 30 nov - 24 dic
    if ((month === 11 && day >= 30) || (month === 12 && day <= 24)) {
      // III Domingo de Adviento (Gaudete): 14 dic - rosado
      if (month === 12 && day === 14) {
        return {
          name: 'III Domingo de Adviento (Gaudete)',
          color: 'rose',
          gradient: liturgicalColors.rose,
        };
      }
      return { name: 'Adviento', color: 'purple', gradient: liturgicalColors.purple };
    }

    // NAVIDAD 2025-2026: 25 dic - 11 ene 2026
    if (month === 12 && day >= 25) {
      return { name: 'Navidad', color: 'white', gradient: liturgicalColors.white };
    }
  }

  // AÑO 2026
  if (year === 2026) {
    // NAVIDAD (continuación): 1 ene - 11 ene
    if (month === 1 && day <= 11) {
      return { name: 'Navidad', color: 'white', gradient: liturgicalColors.white };
    }

    // TIEMPO ORDINARIO (primera parte): 12 ene - 17 feb
    if ((month === 1 && day >= 12) || (month === 2 && day <= 17)) {
      return { name: 'Tiempo Ordinario', color: 'green', gradient: liturgicalColors.green };
    }

    // CUARESMA: 18 feb - 2 abr (mañana)
    if ((month === 2 && day >= 18) || month === 3 || (month === 4 && day <= 2)) {
      // IV Domingo de Cuaresma (Laetare): 15 marzo - rosado
      if (month === 3 && day === 15) {
        return {
          name: 'IV Domingo de Cuaresma (Laetare)',
          color: 'rose',
          gradient: liturgicalColors.rose,
        };
      }
      return { name: 'Cuaresma', color: 'purple', gradient: liturgicalColors.purple };
    }

    // SEMANA SANTA: 29 marzo - 4 abril
    if (month === 3 && day >= 29) {
      // Domingo de Ramos
      if (day === 29) {
        return { name: 'Domingo de Ramos', color: 'red', gradient: liturgicalColors.red };
      }
      // Lunes, Martes, Miércoles Santo
      if (day >= 30 && day <= 31) {
        return { name: 'Semana Santa', color: 'purple', gradient: liturgicalColors.purple };
      }
    }

    if (month === 4) {
      // Miércoles Santo (1 abril)
      if (day === 1) {
        return { name: 'Semana Santa', color: 'purple', gradient: liturgicalColors.purple };
      }
      // Jueves Santo (2 abril)
      if (day === 2) {
        return { name: 'Jueves Santo', color: 'white', gradient: liturgicalColors.white };
      }
      // Viernes Santo (3 abril)
      if (day === 3) {
        return { name: 'Viernes Santo', color: 'red', gradient: liturgicalColors.red };
      }
      // Sábado Santo (4 abril)
      if (day === 4) {
        return { name: 'Sábado Santo', color: 'purple', gradient: liturgicalColors.purple };
      }

      // TIEMPO PASCUAL: 5 abril en adelante (continúa en mayo)
      if (day >= 5) {
        return { name: 'Tiempo Pascual', color: 'white', gradient: liturgicalColors.white };
      }
    }

    // TIEMPO PASCUAL (continuación en mayo)
    if (month === 5 && day <= 24) {
      if (day === 24) {
        return { name: 'Pentecostés', color: 'red', gradient: liturgicalColors.red };
      }
      return { name: 'Tiempo Pascual', color: 'white', gradient: liturgicalColors.white };
    }

    // TIEMPO ORDINARIO (segunda parte): 25 mayo - 21 noviembre
    if ((month === 5 && day >= 25) || (month >= 6 && month <= 10) || (month === 11 && day <= 21)) {
      // Solemnidades especiales
      // Santísima Trinidad: 31 mayo - blanco
      if (month === 5 && day === 31) {
        return { name: 'Santísima Trinidad', color: 'white', gradient: liturgicalColors.white };
      }
      // Corpus Christi: 4 junio - blanco
      if (month === 6 && day === 4) {
        return { name: 'Corpus Christi', color: 'white', gradient: liturgicalColors.white };
      }
      // Sagrado Corazón: 12 junio - blanco
      if (month === 6 && day === 12) {
        return {
          name: 'Sagrado Corazón de Jesús',
          color: 'white',
          gradient: liturgicalColors.white,
        };
      }
      // Todos los Santos: 1 noviembre - blanco
      if (month === 11 && day === 1) {
        return { name: 'Todos los Santos', color: 'white', gradient: liturgicalColors.white };
      }
      // Fieles Difuntos: 2 noviembre - morado
      if (month === 11 && day === 2) {
        return { name: 'Fieles Difuntos', color: 'purple', gradient: liturgicalColors.purple };
      }

      return { name: 'Tiempo Ordinario', color: 'green', gradient: liturgicalColors.green };
    }

    // Cristo Rey: 22 noviembre - blanco
    if (month === 11 && day === 22) {
      return { name: 'Cristo Rey del Universo', color: 'white', gradient: liturgicalColors.white };
    }

    // ADVIENTO 2026: 29 nov - 24 dic
    if ((month === 11 && day >= 29) || (month === 12 && day <= 24)) {
      // III Domingo de Adviento (Gaudete): 13 dic - rosado
      if (month === 12 && day === 13) {
        return {
          name: 'III Domingo de Adviento (Gaudete)',
          color: 'rose',
          gradient: liturgicalColors.rose,
        };
      }
      return { name: 'Adviento', color: 'purple', gradient: liturgicalColors.purple };
    }

    // NAVIDAD 2026: 25 dic en adelante
    if (month === 12 && day >= 25) {
      return { name: 'Navidad', color: 'white', gradient: liturgicalColors.white };
    }
  }

  // Por defecto: Tiempo Ordinario (verde)
  return { name: 'Tiempo Ordinario', color: 'green', gradient: liturgicalColors.green };
}
