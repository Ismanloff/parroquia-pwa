import dayjs from 'dayjs';
import 'dayjs/locale/es';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const DEFAULT_TIMEZONE = 'Europe/Madrid';

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD en la timezone de Madrid
 */
export const getTodayDate = (): string => {
  return dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Formatea una fecha con el formato especificado en la timezone de Madrid
 */
export const formatDate = (date: Date | string | dayjs.Dayjs, format: string): string => {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format(format);
};

/**
 * Crea un objeto dayjs con la timezone de Madrid
 */
export const dayjsTz = (date?: Date | string): dayjs.Dayjs => {
  return dayjs(date).tz(DEFAULT_TIMEZONE);
};

export default dayjs;
