import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Calendar as CalendarIcon, Home, MessageCircle, Settings } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { InstallPWA } from '@/components/InstallPWA';

const TabLayout = () => (
  <>
    {/* Banner de instalación PWA */}
    <InstallPWA />

    <Tabs
      screenOptions={({ route }) => ({
      // Colores del tab bar - iOS System Blue
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
      headerShown: false,

      // Estilo del Tab Bar - Liquid Glass flotante con BlurView
      tabBarStyle: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 35,
        // Background más translúcido para que el blur se note
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: '#007AFF',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        paddingBottom: 10,
        paddingTop: 10,
        paddingHorizontal: 20,
        // Borde sutil para definición
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        // Overflow para que el blur funcione
        overflow: 'hidden',
      },

      // Background con blur nativo
      tabBarBackground: () => (
        Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ) : null
      ),

      // Estilo de las etiquetas
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: -0.2,
        marginTop: 4,
      },

      // Ocultar el borde superior
      tabBarShowLabel: true,

      // Iconos del tab bar
      tabBarIcon: ({ color, size, focused }) => {
        const iconSize = focused ? 26 : 24;

        switch (route.name) {
          case 'home':
            return <Home color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
          case 'calendar':
            return <CalendarIcon color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
          case 'chat':
            return <MessageCircle color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
          case 'settings':
            return <Settings color={color} size={iconSize} strokeWidth={focused ? 2.5 : 2} />;
          default:
            return null;
        }
      },
    })}
  >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  </>
);

export default TabLayout;
