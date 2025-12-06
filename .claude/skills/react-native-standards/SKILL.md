# React Native Standards Skill

## Stack del Proyecto
- **React Native:** 0.81.4
- **Expo:** 54.0.0 con Expo Router 6.0.12
- **TypeScript:** 5.9.2
- **Styling:** NativeWind 4.1.23 (Tailwind para RN)
- **Iconos:** Lucide React Native 0.545.0
- **State:** Zustand 5.0.8 + React Query 5.90.3

## Cuándo Usar Este Skill
- ✅ Crear nuevas pantallas en `app/`
- ✅ Crear componentes en `components/`
- ✅ Refactorizar código existente
- ✅ Crear hooks personalizados
- ✅ Revisar PRs

---

## ESTRUCTURA DE COMPONENTES

### Anatomía Estándar
```typescript
// ✅ CORRECTO - components/SantoCard.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

// 1. Interfaces primero
interface SantoCardProps {
  date: string;
  name: string;
  bio: string;
  onPress?: () => void;
}

// 2. Componente tipado
export const SantoCard: React.FC<SantoCardProps> = ({ 
  date, name, bio, onPress 
}) => {
  // 3. State
  const [expanded, setExpanded] = useState(false);
  
  // 4. Callbacks memoizados
  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);
  
  // 5. Render con NativeWind
  return (
    <TouchableOpacity
      onPress={onPress || handleToggle}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-3"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">
          {date}
        </Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
      
      <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {name}
      </Text>
      
      <Text 
        className="text-sm text-gray-600 dark:text-gray-300"
        numberOfLines={expanded ? undefined : 3}
      >
        {bio}
      </Text>
    </TouchableOpacity>
  );
};
```

### ❌ Anti-patrones a Evitar
```typescript
// NO hacer esto:
import { StyleSheet } from 'react-native';

// ❌ Sin tipado
export const SantoCard = ({ date, name }) => {
  // ❌ StyleSheet con NativeWind
  return <View style={styles.container} />;
};

const styles = StyleSheet.create({ /* ... */ }); // ❌ NO usar StyleSheet
```

---

## PANTALLAS CON EXPO ROUTER

### Patrón de Pantalla
```typescript
// ✅ CORRECTO - app/(tabs)/home.tsx
import React from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDailyContent } from '@/hooks/useDailyContent';

export default function HomeScreen() {
  const { saint, gospel, loading, refetch } = useDailyContent();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar style="auto" />
      
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          Santo del Día
        </Text>
      </View>
      
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {saint && <SantoCard {...saint} />}
        {gospel && <EvangelioCard {...gospel} />}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## NAMING CONVENTIONS

```
✅ CORRECTO:
/app/(tabs)/home.tsx           # Screens: lowercase (Expo Router)
/components/SantoCard.tsx      # Components: PascalCase
/hooks/useAuth.ts              # Hooks: camelCase + "use" prefix
/lib/supabase.ts               # Services: camelCase
/stores/chatStore.ts           # Stores: camelCase + "Store" suffix
/types/models.ts               # Types: camelCase

❌ INCORRECTO:
/app/(tabs)/HomeScreen.tsx     # ❌ NO PascalCase en Expo Router
/components/santo-card.tsx     # ❌ NO kebab-case
/hooks/AuthHook.ts             # ❌ Debe empezar con "use"
```

---

## CUSTOM HOOKS

### Hook con React Query
```typescript
// ✅ CORRECTO - hooks/useDailyContent.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Saint, Gospel } from '@/types';

export const useDailyContent = () => {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['dailyContent', today],
    queryFn: async () => {
      const { data: saint } = await supabase
        .from('saints')
        .select('*')
        .eq('date', today)
        .single();
      
      const { data: gospel } = await supabase
        .from('gospels')
        .select('*')
        .eq('date', today)
        .single();
      
      return { saint, gospel };
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};
```

### Hook con Zustand
```typescript
// ✅ CORRECTO - stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## PERFORMANCE

### Memoización
```typescript
// ✅ CORRECTO - Memo para listas
import { memo } from 'react';

export const MessageBubble = memo<MessageBubbleProps>(({ message }) => {
  return <View>...</View>;
}, (prev, next) => prev.message.id === next.message.id);
```

### FlatList Optimizado
```typescript
<FlatList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  keyExtractor={(item) => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  initialNumToRender={15}
/>
```

---

## CHECKLIST PRE-COMMIT

- [ ] ✅ Tipado explícito en todos los componentes/funciones
- [ ] ✅ Usar alias `@/` para imports absolutos
- [ ] ✅ Solo NativeWind (NO StyleSheet ni inline styles)
- [ ] ✅ SafeAreaView de `react-native-safe-area-context`
- [ ] ✅ Lucide React Native para iconos
- [ ] ✅ React Query con `staleTime` y `gcTime`
- [ ] ✅ Componentes de lista con `React.memo`
- [ ] ✅ Callbacks con `useCallback`
- [ ] ✅ Dark mode con `dark:` prefixes
- [ ] ✅ Estados loading/error manejados

---

## COMANDOS

```bash
npm start              # Iniciar Expo
npm run ios            # iOS simulator
npm run android        # Android emulator
npm test               # Jest tests
npm run lint           # ESLint
```
