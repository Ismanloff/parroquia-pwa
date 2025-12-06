import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect } from 'expo-router';
import { Sparkles, BookOpen, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyContent } from '@/hooks/useDailyContent';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { getLiturgicalSeason } from '@/lib/liturgicalColors';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { theme } = useTheme();
  const {
    saint,
    gospel,
    isLoading,
    error: contentError,
    refetch,
    isSupabaseConfigured: dataSupabaseConfigured,
  } = useDailyContent();
  const { isSupabaseConfigured: authSupabaseConfigured, error: authError } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [gospelExpanded, setGospelExpanded] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top cuando el tab se enfoca
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [])
  );

  // Obtener el color litúrgico del día
  const liturgicalSeason = useMemo(() => getLiturgicalSeason(new Date()), []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const supabaseReady = authSupabaseConfigured && dataSupabaseConfigured;

  if (!supabaseReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Inicio',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.primaryForeground,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <EmptyState
          title="Modo de prueba"
          message="Estás en modo de prueba. Configura Supabase en el archivo .env para ver contenido real."
        />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Inicio',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.primaryForeground,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <EmptyState
          icon={<BookOpen size={48} color={theme.colors.mutedForeground} />}
          title="No se pudo cargar tu sesión"
          message={authError}
          actionLabel="Reintentar"
          onAction={() => {
            void refetch();
          }}
        />
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return <Loading message="Cargando contenido del día..." />;
  }

  if (contentError) {
    return (
      <EmptyState
        icon={<BookOpen size={48} color={theme.colors.mutedForeground} />}
        title="Error al cargar"
        message="No se pudo cargar el contenido. Por favor intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  const today = formatDate(new Date(), 'D [de] MMMM, YYYY');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Inicio',
          headerShown: false,
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header con fecha elegante y color litúrgico */}
        <LinearGradient
          colors={liturgicalSeason.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.dateHeaderContainer}>
            <CalendarDays size={20} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.dateHeaderText}>{today}</Text>
          </View>
          <Text style={styles.headerSubtitle}>{liturgicalSeason.name}</Text>
        </LinearGradient>

        {/* Santo del día - Card mejorada */}
        <Card style={styles.modernCard}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.modernIconContainer}
            >
              <Sparkles size={28} color="#D97706" strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>SANTO DEL DÍA</Text>
              <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
                {saint?.name || 'Cargando...'}
              </Text>
            </View>
          </View>

          {saint ? (
            <View style={styles.cardBody}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.bioText, { color: theme.colors.foreground }]}>
                {saint.bio}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: theme.colors.mutedForeground }]}>
                No hay información del santo para hoy
              </Text>
              <Button
                title="Reintentar"
                onPress={() => {
                  void refetch();
                }}
                variant="outline"
                size="sm"
                style={styles.retryButton}
              />
            </View>
          )}
        </Card>

        {/* Evangelio del día - Card mejorada */}
        <Card style={styles.modernCard}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE']}
              style={styles.modernIconContainer}
            >
              <BookOpen size={28} color="#1D4ED8" strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.cardLabel, { color: theme.colors.mutedForeground }]}>EVANGELIO DEL DÍA</Text>
              <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
                {gospel?.passage || 'Cargando...'}
              </Text>
            </View>
          </View>

          {gospel ? (
            <View style={styles.cardBody}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.gospelHeader}>
                <Text style={[styles.gospelTitle, { color: theme.colors.mutedForeground }]}>{gospel.title}</Text>
              </View>
              <Text
                style={[styles.gospelContent, { color: theme.colors.foreground }]}
                numberOfLines={gospelExpanded ? undefined : 5}
              >
                {gospel.content}
              </Text>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setGospelExpanded(!gospelExpanded)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={gospelExpanded ? 'Ver menos' : 'Leer más'}
              >
                <Text style={styles.expandButtonText}>
                  {gospelExpanded ? 'Ver menos' : 'Leer más'}
                </Text>
                {gospelExpanded ? (
                  <ChevronUp size={18} color="#8B5CF6" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={18} color="#8B5CF6" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: theme.colors.mutedForeground }]}>
                No hay evangelio disponible para hoy
              </Text>
              <Button
                title="Reintentar"
                onPress={() => {
                  void refetch();
                }}
                variant="outline"
                size="sm"
                style={styles.retryButton}
              />
            </View>
          )}
        </Card>

        {/* Espaciado final */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 110, // Espacio para el Tab Bar flotante
  },
  // Header con gradiente
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    marginBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginTop: 2,
  },
  // Cards modernas
  modernCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  modernIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  // Texto del santo
  bioText: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  // Evangelio
  gospelHeader: {
    marginBottom: 8,
  },
  gospelTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic' as const,
  },
  gospelContent: {
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.2,
    textAlign: 'justify' as const,
  },
  // Botón expandir
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginRight: 4,
    letterSpacing: 0.3,
  },
  // Estado vacío
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  bottomSpacer: {
    height: 16,
  },
});
