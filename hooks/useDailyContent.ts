import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getTodayDate } from '@/lib/dayjs';
import type { Saint, Gospel } from '@/types/models';

export const useDailyContent = (date?: string) => {
  const targetDate = date || getTodayDate();

  const saintQuery = useQuery<Saint | null>({
    queryKey: ['saint', targetDate],
    queryFn: async () => {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('saints')
        .select('*')
        .eq('date', targetDate)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: isSupabaseConfigured,
  });

  const gospelQuery = useQuery<Gospel | null>({
    queryKey: ['gospel', targetDate],
    queryFn: async () => {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('gospels')
        .select('*')
        .eq('date', targetDate)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: isSupabaseConfigured,
  });

  return {
    saint: saintQuery.data ?? null,
    gospel: gospelQuery.data ?? null,
    isLoading:
      (isSupabaseConfigured && (saintQuery.isLoading || gospelQuery.isLoading)) ||
      false,
    error: saintQuery.error || gospelQuery.error || null,
    refetch: () =>
      Promise.all([saintQuery.refetch(), gospelQuery.refetch()]).then(() => undefined),
    isSupabaseConfigured,
  };
};
