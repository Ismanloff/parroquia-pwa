# 🔧 Arquitectura de Temas - Corrección Crítica

## 🔴 **Problema Encontrado**

El sistema inicial tenía un error fundamental:

### **❌ ANTES (Incorrecto):**
```tsx
// ThemeContext.tsx - LÍNEAS 84-130
useEffect(() => {
  if (typeof document !== 'undefined') {  // ❌ NO EXISTE EN REACT NATIVE
    const root = document.documentElement;
    root.style.setProperty('--color-background', hexToRgb(...));
    // ...
  }
}, [theme]);
```

**Problemas:**
1. ❌ `document.documentElement` NO existe en React Native (solo en web)
2. ❌ CSS variables (`--color-*`) solo funcionan en navegadores web
3. ❌ Tailwind esperaba CSS variables que nunca se inyectaban en móvil
4. ❌ Dark mode no funcionaría en la app nativa

---

## ✅ **Solución Implementada**

### **Arquitectura Correcta para React Native + NativeWind:**

```
┌─────────────────────────────────────────────────────────┐
│                     ThemeProvider                        │
│  - Detecta preferencia sistema (useColorScheme)         │
│  - Persiste en AsyncStorage                             │
│  - Provee theme object via Context                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   useTheme() hook                        │
│  Returns: { theme, isDark, themeMode, setThemeMode }    │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────┐
    │ Tailwind Classes  │  │  Inline Styles   │
    │  (Light Only)     │  │  (Dynamic Theme) │
    │                   │  │                  │
    │ className=        │  │ style={{         │
    │  "p-4 rounded-lg" │  │   backgroundColor:│
    │                   │  │   theme.colors.bg│
    │                   │  │ }}               │
    └───────────────────┘  └──────────────────┘
```

---

## 📐 **Cómo Funciona Ahora**

### **1. themes.ts** - Define colores y tokens
```tsx
export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#1F2937',
    primary: '#3B82F6',
    // ... 20+ colores
  },
  spacing: { xs: 4, sm: 8, md: 16, ... },
  // ...
};

export const darkTheme = {
  colors: {
    background: '#111827',
    foreground: '#F9FAFB',
    primary: '#60A5FA', // Más claro para dark mode
    // ...
  },
  // spacing, borderRadius, etc. iguales
};
```

### **2. ThemeContext.tsx** - Gestiona estado
```tsx
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark'
  const [themeMode, setThemeMode] = useState('system');

  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  // ✅ NO intenta usar document.documentElement
  // ✅ Solo provee el objeto theme via Context

  return <ThemeContext.Provider value={{ theme, isDark, ...}}>
    {children}
  </ThemeContext.Provider>;
}
```

### **3. Uso en Componentes**

#### **Opción A: Tailwind Classes (solo light mode)**
```tsx
<View className="bg-card p-4 rounded-lg">
  <Text className="text-card-foreground">Hola</Text>
</View>
```
⚠️ **Limitación:** Los colores de Tailwind están hardcodeados a light mode en `tailwind.config.js`

#### **Opción B: Inline Styles Dinámicos (soporte dark mode)**
```tsx
const { theme } = useTheme();

<View style={{ backgroundColor: theme.colors.card }} className="p-4 rounded-lg">
  <Text style={{ color: theme.colors.cardForeground }}>Hola</Text>
</View>
```
✅ **Ventaja:** Dark mode funciona correctamente

#### **Opción C: ThemeWrapper Helper**
```tsx
import { ThemeWrapper } from '@/components/ThemeWrapper';

<ThemeWrapper bg="card" className="p-4 rounded-lg">
  <Text style={{ color: theme.colors.cardForeground }}>Hola</Text>
</ThemeWrapper>
```
✅ **Ventaja:** Combina lo mejor de ambos

---

## 🎨 **Tailwind Config Actualizado**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',  // ✅ Valores fijos light mode
        primary: { DEFAULT: '#3B82F6', foreground: '#FFFFFF' },
        // ... NO usa CSS variables
      },
    },
  },
};
```

**Por qué así:**
- ✅ Tailwind funciona en React Native con valores fijos
- ✅ Para dark mode, usamos inline styles con `theme.colors.*`
- ✅ No depende de CSS variables que no existen en RN

---

## 🔄 **Comparación: Web vs React Native**

| Aspecto | Web (React) | React Native |
|---------|-------------|--------------|
| **Dark Mode** | CSS variables + `class="dark"` | Inline styles dinámicos |
| **Tailwind** | Soporta `dark:bg-gray-900` | Solo light mode en classes |
| **DOM** | Sí (`document.documentElement`) | ❌ No existe |
| **CSS Variables** | Sí (`--color-primary`) | ❌ No soportado |
| **Solución** | CSS variables + dark class | `useTheme()` + inline styles |

---

## 📝 **Guía de Uso Recomendada**

### **Regla de Oro:**
```tsx
// ✅ BIEN: Spacing, layout, typography con Tailwind
<View className="p-4 rounded-lg gap-2">

// ✅ BIEN: Colores dinámicos con inline styles
<View style={{ backgroundColor: theme.colors.card }}>

// ❌ MAL: Intentar usar dark: en React Native
<View className="dark:bg-gray-900">  // NO FUNCIONA EN RN
```

### **Patrón Recomendado:**

```tsx
import { useTheme } from '@/hooks/useTheme';

const MyComponent = () => {
  const { theme } = useTheme();

  return (
    <View
      className="p-4 rounded-lg gap-3"  // Layout/spacing
      style={{ backgroundColor: theme.colors.background }}  // Colores dinámicos
    >
      <Text
        className="text-base font-semibold"  // Typography
        style={{ color: theme.colors.foreground }}  // Color dinámico
      >
        Hola Mundo
      </Text>
    </View>
  );
};
```

---

## 🚀 **Próximos Pasos (Opcionales)**

### **Opción 1: Wrapper Components**
Crear wrappers para cada componente base:

```tsx
// components/themed/ThemedView.tsx
export const ThemedView = ({ bg = 'background', ...props }) => {
  const { theme } = useTheme();
  return <View style={{ backgroundColor: theme.colors[bg] }} {...props} />;
};

// components/themed/ThemedText.tsx
export const ThemedText = ({ color = 'foreground', ...props }) => {
  const { theme } = useTheme();
  return <Text style={{ color: theme.colors[color] }} {...props} />;
};

// Uso:
<ThemedView bg="card" className="p-4">
  <ThemedText color="card-foreground">Hola</ThemedText>
</ThemedView>
```

### **Opción 2: NativeWind v4 con vars() (Experimental)**
NativeWind v4 (aún en beta) soporta `vars()`:

```tsx
// Requiere NativeWind v4+
import { vars } from 'nativewind';

const theme = vars({
  '--color-bg': isDark ? '#111827' : '#FFFFFF',
});

<View style={theme} className="bg-[--color-bg]">
```

⚠️ **No recomendado todavía:** NativeWind v4 está en beta y puede cambiar.

---

## ✅ **Estado Actual**

| Componente | Estado | Dark Mode |
|-----------|--------|-----------|
| **ThemeContext** | ✅ Corregido | ✅ Funcional |
| **tailwind.config** | ✅ Simplificado | ⚠️ Light only |
| **Button** | ✅ Migrado | ✅ Soporta (inline styles) |
| **Settings** | ✅ Con toggle | ✅ Soporta (inline styles) |
| **_layout** | ✅ Migrado | ✅ Soporta (inline styles) |
| **Card, Input, etc.** | ⏳ Pendiente | ⏳ Pendiente |

---

## 📚 **Referencias**

- [NativeWind Docs - Theming](https://www.nativewind.dev/v4/core-concepts/themes)
- [React Native - useColorScheme](https://reactnative.dev/docs/usecolorscheme)
- [Expo - Dark Mode](https://docs.expo.dev/develop/user-interface/color-themes/)

---

**Última actualización:** 2025-10-16
**Estado:** ✅ **ARQUITECTURA CORREGIDA**

🎯 **El sistema ahora es compatible con React Native y funcionará correctamente en dispositivos móviles.**
