import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const TIMEZONE = process.env.EXPO_PUBLIC_TIMEZONE || 'Europe/Madrid';

export const getTodayDate = (): string => {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).tz(TIMEZONE).format(format);
};

export const parseDate = (date: string): dayjs.Dayjs => {
  return dayjs(date).tz(TIMEZONE);
};

export { dayjs };
export default dayjs;
