import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
  PlatformColor,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, X, List } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  allDay: boolean;
};

type ViewMode = 'week' | 'month';

// Colores para eventos - Paleta suave inspirada en iOS System Colors
const EVENT_COLORS = [
  { primary: '#007AFF', light: '#E5F1FF', border: '#66A3FF' }, // systemBlue - Azul iOS
  { primary: '#5AC8FA', light: '#E0F5FF', border: '#8CD8FA' }, // systemTeal - Teal suave
  { primary: '#34C759', light: '#E3F9E5', border: '#7ADB89' }, // systemGreen - Verde menta
  { primary: '#30B0C7', light: '#E0F4F7', border: '#6AC5D4' }, // systemCyan - Cyan suave
  { primary: '#5856D6', light: '#EEEEFF', border: '#8B8AE8' }, // systemIndigo - Índigo suave
  { primary: '#AF52DE', light: '#F5E6FF', border: '#C98AE8' }, // systemPurple - Púrpura suave
];

const getEventColor = (eventTitle: string) => {
  const hash = eventTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EVENT_COLORS[hash % EVENT_COLORS.length];
};

const CalendarScreen = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null); // Día seleccionado en vista mensual
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top cuando el tab se enfoca
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [])
  );

  const fetchWeekEvents = useCallback(async (forceRefresh = false) => {
    try {
      const url = `${API_BASE}/api/calendar/events?filter=week${forceRefresh ? '&refresh=true' : ''}`;
      console.log('📅 Fetching week events from:', url, forceRefresh ? '(FORCE REFRESH)' : '');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Week events received:', data.events?.length || 0, 'events');
      if (forceRefresh) {
        console.log('🔄 Fresh data from Google Calendar');
      }

      const allEvents = Array.isArray(data.events) ? data.events : [];
      setWeekEvents(allEvents);
    } catch (error) {
      console.error('❌ Error fetching week events:', error);
      setWeekEvents([]);
    }
  }, [API_BASE]);

  const fetchMonthEvents = useCallback(async (date: Date, forceRefresh = false) => {
    try {
      const url = `${API_BASE}/api/calendar/events?filter=month&date=${date.toISOString()}${forceRefresh ? '&refresh=true' : ''}`;
      console.log('📅 Fetching month events for:', date.toISOString(), forceRefresh ? '(FORCE REFRESH)' : '');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Month events received:', data.events?.length || 0, 'events');
      if (forceRefresh) {
        console.log('🔄 Fresh data from Google Calendar');
      }

      setMonthEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('❌ Error fetching month events:', error);
      setMonthEvents([]);
    }
  }, [API_BASE]);

  const loadData = useCallback(
    async (options?: { silent?: boolean; forceRefresh?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        if (viewMode === 'month') {
          await fetchMonthEvents(selectedMonth, options?.forceRefresh);
        } else {
          await fetchWeekEvents(options?.forceRefresh);
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [viewMode, selectedMonth, fetchMonthEvents, fetchWeekEvents]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Pull-to-refresh: Forcing cache invalidation');
    await loadData({ silent: true, forceRefresh: true });
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    if (API_BASE) {
      void loadData();
    }
  }, [API_BASE, loadData]);

  useEffect(() => {
    if (!API_BASE) return;

    const intervalId = setInterval(() => {
      void loadData({ silent: true });
    }, 120000);

    return () => {
      clearInterval(intervalId);
    };
  }, [API_BASE, loadData]);

  // Resetear selectedDay al día actual cada vez que se entra a la pantalla
  useFocusEffect(
    useCallback(() => {
      setSelectedDay(new Date());
    }, [])
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Madrid'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Madrid'
    });
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    // Normalizar today a medianoche para comparaciones consistentes
    today.setHours(0, 0, 0, 0);

    // Generar los próximos 7 días desde HOY (no desde el lunes)
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (day: Date, events: CalendarEvent[]) => {
    const dayString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start);
      const eventString = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventString === dayString;
    });

    return filteredEvents.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getEventBadge = (eventDate: Date) => {
    if (isToday(eventDate)) {
      return { text: 'HOY', color: '#007AFF', bgColor: '#E5F1FF' }; // systemBlue suave
    }
    if (isTomorrow(eventDate)) {
      return { text: 'MAÑANA', color: '#5AC8FA', bgColor: '#E0F5FF' }; // systemTeal suave
    }
    return null;
  };

  if (!API_BASE) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <CalendarIcon size={48} color="#9ca3af" />
          <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 16 }}>
            Configura EXPO_PUBLIC_API_BASE para ver el calendario
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: '#6B7280', marginTop: 16 }}>Cargando eventos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: Platform.OS === 'ios' ? PlatformColor('systemGroupedBackground') : '#F9FAFB'
    }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con fecha actual - Minimalista y elegante */}
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#9CA3AF',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              timeZone: 'Europe/Madrid'
            }).toUpperCase()}
          </Text>
          <Text style={{
            fontSize: 34,
            fontWeight: '700',
            color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
            letterSpacing: 0.4,
            lineHeight: 40,
          }}>
            {new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              timeZone: 'Europe/Madrid'
            })}
          </Text>
        </View>

        {/* Tabs modernos - Segmented Control style iOS 18 con Liquid Glass */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: Platform.OS === 'ios'
            ? PlatformColor('secondarySystemGroupedBackground')
            : 'rgba(255, 255, 255, 0.95)',
          marginHorizontal: 24,
          marginTop: 8,
          marginBottom: 24,
          borderRadius: 14,
          padding: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
        }}>
          <TouchableOpacity
            onPress={() => setViewMode('week')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: viewMode === 'week'
                ? (Platform.OS === 'ios' ? PlatformColor('systemBackground') : '#FFFFFF')
                : 'transparent',
              minHeight: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'week' ? 0.12 : 0,
              shadowRadius: 6,
              elevation: viewMode === 'week' ? 4 : 0,
            }}
            activeOpacity={0.6}
          >
            <List
              size={18}
              color={viewMode === 'week'
                ? (Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937')
                : '#9CA3AF'
              }
              strokeWidth={2.5}
            />
            <Text style={{
              marginLeft: 8,
              fontSize: 15,
              fontWeight: '600',
              color: viewMode === 'week'
                ? (Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937')
                : '#9CA3AF',
              letterSpacing: -0.2,
            }}>
              Semanal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('month')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: viewMode === 'month'
                ? (Platform.OS === 'ios' ? PlatformColor('systemBackground') : '#FFFFFF')
                : 'transparent',
              minHeight: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: viewMode === 'month' ? 0.12 : 0,
              shadowRadius: 6,
              elevation: viewMode === 'month' ? 4 : 0,
            }}
            activeOpacity={0.6}
          >
            <CalendarIcon
              size={18}
              color={viewMode === 'month'
                ? (Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937')
                : '#9CA3AF'
              }
              strokeWidth={2.5}
            />
            <Text style={{
              marginLeft: 8,
              fontSize: 15,
              fontWeight: '600',
              color: viewMode === 'month'
                ? (Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937')
                : '#9CA3AF',
              letterSpacing: -0.2,
            }}>
              Mensual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vista Semanal */}
        {viewMode === 'week' && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            {weekEvents.length === 0 ? (
              <View style={{
                backgroundColor: Platform.OS === 'ios'
                  ? PlatformColor('secondarySystemGroupedBackground')
                  : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 28,
                padding: 48,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 6,
              }}>
                <View style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <CalendarIcon size={44} color="#9CA3AF" strokeWidth={2} />
                </View>
                <Text style={{
                  color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: 0.4,
                  marginBottom: 10,
                }}>
                  No hay eventos
                </Text>
                <Text style={{
                  color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#6B7280',
                  textAlign: 'center',
                  fontSize: 15,
                  letterSpacing: -0.2,
                  lineHeight: 22,
                }}>
                  No tienes eventos programados{'\n'}para los próximos 7 días
                </Text>
              </View>
            ) : (
              <>
                {getNext7Days().map((day) => {
                  const events = getEventsForDay(day, weekEvents);
                  if (events.length === 0) return null;

                  const dayLabel = isToday(day) ? 'Hoy' : isTomorrow(day) ? 'Mañana' : formatShortDate(day);

                  return (
                    <View key={day.toISOString()} style={{ marginBottom: 28 }}>
                      {/* Separador de día - SF-style con mejor tipografía */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                        paddingHorizontal: 4,
                      }}>
                        <Text style={{
                          fontSize: 22,
                          fontWeight: '700',
                          color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                          letterSpacing: 0.4,
                          marginRight: 10,
                        }}>
                          {dayLabel}
                        </Text>
                        <View style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: isToday(day)
                            ? 'rgba(0, 122, 255, 0.12)'
                            : 'rgba(90, 200, 250, 0.12)',
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: isToday(day) ? '#007AFF' : '#5AC8FA',
                            letterSpacing: 0.5,
                          }}>
                            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                          </Text>
                        </View>
                      </View>

                      {/* Timeline de eventos */}
                      <View style={{ position: 'relative' }}>
                        {/* Línea vertical del timeline */}
                        {events.length > 1 && (
                          <View style={{
                            position: 'absolute',
                            left: 20,
                            top: 28,
                            bottom: 28,
                            width: 2,
                            backgroundColor: '#E5E7EB',
                            zIndex: 0,
                          }} />
                        )}

                        {events.map((event, index) => {
                          const colors = getEventColor(event.title);
                          const badge = getEventBadge(new Date(event.start));

                          return (
                            <TouchableOpacity
                              key={event.id}
                              onPress={() => setSelectedEvent(event)}
                              activeOpacity={0.6}
                              style={{
                                marginBottom: index < events.length - 1 ? 16 : 0,
                              }}
                            >
                              <View style={{
                                flexDirection: 'row',
                                backgroundColor: Platform.OS === 'ios'
                                  ? PlatformColor('secondarySystemGroupedBackground')
                                  : 'rgba(255, 255, 255, 0.98)',
                                borderRadius: 24,
                                overflow: 'hidden',
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 16,
                                elevation: 6,
                                borderWidth: 1,
                                borderColor: 'rgba(0,0,0,0.04)',
                              }}>
                                {/* Barra lateral de color - Efecto Liquid Glass */}
                                <View style={{
                                  width: 5,
                                  backgroundColor: colors.primary,
                                  shadowColor: colors.primary,
                                  shadowOffset: { width: 2, height: 0 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 8,
                                }} />

                                <View style={{ flex: 1, padding: 20 }}>
                                  {/* Header del evento con badge */}
                                  <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    marginBottom: 12,
                                  }}>
                                    <Text style={{
                                      flex: 1,
                                      fontSize: 17,
                                      fontWeight: '600',
                                      color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                                      letterSpacing: -0.4,
                                      lineHeight: 24,
                                      paddingRight: 8,
                                    }} numberOfLines={2}>
                                      {event.title}
                                    </Text>

                                    {badge && (
                                      <View style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 10,
                                        backgroundColor: badge.bgColor,
                                        marginLeft: 8,
                                      }}>
                                        <Text style={{
                                          fontSize: 10,
                                          fontWeight: '800',
                                          color: badge.color,
                                          letterSpacing: 0.8,
                                        }}>
                                          {badge.text}
                                        </Text>
                                      </View>
                                    )}
                                  </View>

                                  {/* Descripción */}
                                  {event.description && (
                                    <Text style={{
                                      fontSize: 15,
                                      color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#6B7280',
                                      lineHeight: 22,
                                      marginBottom: 14,
                                      letterSpacing: -0.2,
                                    }} numberOfLines={2}>
                                      {event.description}
                                    </Text>
                                  )}

                                  {/* Metadata - SF-style con mejor espaciado */}
                                  <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: 14,
                                    alignItems: 'center',
                                  }}>
                                    {!event.allDay && (
                                      <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: colors.light,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                      }}>
                                        <Clock size={16} color={colors.primary} strokeWidth={2.5} />
                                        <Text style={{
                                          marginLeft: 7,
                                          fontSize: 14,
                                          fontWeight: '600',
                                          color: colors.primary,
                                          letterSpacing: -0.2,
                                        }}>
                                          {formatTime(event.start)}
                                        </Text>
                                      </View>
                                    )}

                                    {event.location && (
                                      <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1,
                                      }}>
                                        <MapPin size={16} color={Platform.OS === 'ios' ? (PlatformColor('tertiaryLabel') as any) : '#9CA3AF'} strokeWidth={2.5} />
                                        <Text style={{
                                          marginLeft: 7,
                                          fontSize: 14,
                                          fontWeight: '500',
                                          color: Platform.OS === 'ios' ? (PlatformColor('tertiaryLabel') as any) : '#9CA3AF',
                                          flex: 1,
                                          letterSpacing: -0.2,
                                        }} numberOfLines={1}>
                                          {event.location}
                                        </Text>
                                      </View>
                                    )}

                                    {event.allDay && (
                                      <View style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        backgroundColor: colors.light,
                                      }}>
                                        <Text style={{
                                          fontSize: 11,
                                          fontWeight: '700',
                                          color: colors.primary,
                                          letterSpacing: 0.6,
                                        }}>
                                          TODO EL DÍA
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* Vista Mensual - Liquid Glass enhanced */}
        {viewMode === 'month' && (
          <View style={{
            backgroundColor: Platform.OS === 'ios'
              ? PlatformColor('secondarySystemGroupedBackground')
              : 'rgba(255, 255, 255, 0.98)',
            padding: 24,
            borderRadius: 28,
            marginHorizontal: 24,
            marginBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.04)',
          }}>
            {/* Selector de mes - Controles táctiles 44x44pt */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
            }}>
              <TouchableOpacity
                onPress={() => changeMonth('prev')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.6}
              >
                <ChevronLeft size={22} color="#007AFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                letterSpacing: 0.4,
              }}>
                {selectedMonth.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }).replace(/^\w/, c => c.toUpperCase())}
              </Text>

              <TouchableOpacity
                onPress={() => changeMonth('next')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.6}
              >
                <ChevronRight size={22} color="#007AFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Días de la semana - Tipografía SF-style */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                <Text key={i} style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: '700',
                  color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#9CA3AF',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Grid del calendario */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {getDaysInMonth(selectedMonth).map((day, index) => {
                const eventsForDay = day ? getEventsForDay(day, monthEvents) : [];
                const hasEvents = eventsForDay.length > 0;
                const dayIsToday = day && isToday(day);
                const dayIsSelected = day && selectedDay && day.toDateString() === selectedDay.toDateString();
                const eventColors = eventsForDay.slice(0, 3).map(e => getEventColor(e.title).primary);

                return (
                  <TouchableOpacity
                    key={index}
                    disabled={!day}
                    onPress={() => day && setSelectedDay(day)}
                    activeOpacity={0.6}
                    style={{
                      width: '14.28%',
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                    }}
                  >
                    {day ? (
                      <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: dayIsToday
                            ? '#007AFF'
                            : dayIsSelected
                            ? 'rgba(0, 122, 255, 0.12)'
                            : hasEvents
                            ? Platform.OS === 'ios' ? (PlatformColor('tertiarySystemGroupedBackground') as any) : '#F9FAFB'
                            : 'transparent',
                          borderWidth: dayIsSelected && !dayIsToday ? 2 : 0,
                          borderColor: '#007AFF',
                          shadowColor: dayIsToday ? '#007AFF' : '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: dayIsToday ? 0.25 : dayIsSelected ? 0.08 : 0,
                          shadowRadius: dayIsToday ? 6 : 3,
                          elevation: dayIsToday ? 4 : dayIsSelected ? 2 : 0,
                        }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: dayIsToday || dayIsSelected ? '700' : hasEvents ? '600' : '500',
                            color: dayIsToday
                              ? '#FFFFFF'
                              : dayIsSelected
                              ? '#007AFF'
                              : Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                            letterSpacing: -0.4,
                            textAlign: 'center',
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                          }}>
                            {day.getDate()}
                          </Text>
                        </View>
                        {hasEvents && !dayIsToday && (
                          <View style={{
                            flexDirection: 'row',
                            marginTop: 4,
                            gap: 3,
                          }}>
                            {eventColors.map((color, i) => (
                              <View
                                key={i}
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: color,
                                  shadowColor: color,
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.4,
                                  shadowRadius: 2,
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lista de eventos del día seleccionado */}
            <View style={{
              marginTop: 20,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 12,
                letterSpacing: 0.5,
              }}>
                {selectedDay
                  ? `Eventos del ${selectedDay.getDate()} de ${selectedDay.toLocaleDateString('es-ES', { month: 'long' })}`
                  : 'Selecciona un día para ver sus eventos'}
              </Text>

              {!selectedDay ? (
                <Text style={{
                  color: '#9CA3AF',
                  textAlign: 'center',
                  paddingVertical: 16,
                  fontSize: 14,
                }}>
                  Toca un día en el calendario para ver sus eventos
                </Text>
              ) : getEventsForDay(selectedDay, monthEvents).length === 0 ? (
                <Text style={{
                  color: '#9CA3AF',
                  textAlign: 'center',
                  paddingVertical: 16,
                  fontSize: 14,
                }}>
                  No hay eventos este día
                </Text>
              ) : (
                getEventsForDay(selectedDay, monthEvents).map((event) => {
                  const colors = getEventColor(event.title);
                  return (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => setSelectedEvent(event)}
                      style={{
                        flexDirection: 'row',
                        backgroundColor: colors.light,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                        borderLeftWidth: 4,
                        borderLeftColor: colors.primary,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: '#1F2937',
                          marginBottom: 4,
                        }}>
                          {event.title}
                        </Text>
                        <Text style={{
                          fontSize: 13,
                          color: '#6B7280',
                        }}>
                          {!event.allDay ? formatTime(event.start) : 'Todo el día'}
                          {event.location && ` • ${event.location}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de detalles del evento - iOS 18 Sheet Presentation Style */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
        presentationStyle="pageSheet"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setSelectedEvent(null)}
          />
          <View style={{
            backgroundColor: Platform.OS === 'ios'
              ? PlatformColor('secondarySystemGroupedBackground')
              : 'rgba(255, 255, 255, 0.98)',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            paddingTop: 12,
            paddingHorizontal: 28,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 16,
            minHeight: 400,
          }}>
            {/* Handle bar - iOS 18 style */}
            <View style={{
              width: 36,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: Platform.OS === 'ios'
                ? (PlatformColor('tertiaryLabel') as any)
                : '#D1D5DB',
              alignSelf: 'center',
              marginBottom: 20,
            }} />

            {/* Header con botón de cierre */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 28,
            }}>
              <Text style={{
                flex: 1,
                fontSize: 28,
                fontWeight: '700',
                color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                letterSpacing: 0.4,
                lineHeight: 36,
              }}>
                {selectedEvent?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.6}
              >
                <X size={20} color={Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#6B7280'} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal con inset grouped background */}
            <View style={{ gap: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: Platform.OS === 'ios'
                  ? PlatformColor('tertiarySystemGroupedBackground')
                  : '#F9FAFB',
                padding: 18,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(0, 122, 255, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={22} color="#007AFF" strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                  <Text style={{
                    fontSize: 17,
                    color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                    fontWeight: '600',
                    letterSpacing: -0.4,
                    marginBottom: 6,
                    lineHeight: 24,
                  }}>
                    {selectedEvent && formatDate(selectedEvent.start)}
                  </Text>
                  {selectedEvent && !selectedEvent.allDay && (
                    <Text style={{
                      fontSize: 15,
                      color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#6B7280',
                      fontWeight: '500',
                      letterSpacing: -0.2,
                    }}>
                      {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                    </Text>
                  )}
                  {selectedEvent && selectedEvent.allDay && (
                    <Text style={{
                      fontSize: 15,
                      color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#6B7280',
                      fontWeight: '500',
                    }}>
                      Todo el día
                    </Text>
                  )}
                </View>
              </View>

              {selectedEvent?.location && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F9FAFB',
                  padding: 18,
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(0, 122, 255, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MapPin size={22} color="#007AFF" strokeWidth={2.5} />
                  </View>
                  <Text style={{
                    flex: 1,
                    marginLeft: 16,
                    fontSize: 16,
                    color: Platform.OS === 'ios' ? (PlatformColor('label') as any) : '#1F2937',
                    fontWeight: '500',
                    lineHeight: 24,
                    letterSpacing: -0.2,
                    alignSelf: 'center',
                  }}>
                    {selectedEvent.location}
                  </Text>
                </View>
              )}

              {selectedEvent?.description && (
                <View style={{
                  backgroundColor: Platform.OS === 'ios'
                    ? PlatformColor('tertiarySystemGroupedBackground')
                    : '#F9FAFB',
                  padding: 20,
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <Text style={{
                    fontSize: 15,
                    color: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as any) : '#4B5563',
                    lineHeight: 24,
                    letterSpacing: -0.2,
                  }}>
                    {selectedEvent.description}
                  </Text>
                </View>
              )}
            </View>

            {/* Botón de cierre - iOS 18 style */}
            <TouchableOpacity
              onPress={() => setSelectedEvent(null)}
              activeOpacity={0.8}
              style={{
                marginTop: 32,
                backgroundColor: '#007AFF',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontWeight: '600',
                letterSpacing: -0.4,
              }}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CalendarScreen;
