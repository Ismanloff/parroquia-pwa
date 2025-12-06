# 🎬 Cómo Activar las Animaciones (React Native Reanimated)

## ⚠️ Estado Actual

Las animaciones están **temporalmente deshabilitadas** para poder usar la app en Expo Go.

**Motivo**: `react-native-reanimated` requiere código nativo que no está incluido en Expo Go.

---

## ✅ Lo que SÍ funciona actualmente

- ✅ **Dark Mode completo** (light/dark/system)
- ✅ **Colores semánticos** en todos los componentes
- ✅ **Toggle de tema** en Settings
- ✅ **Persistencia** en AsyncStorage
- ✅ **Detección automática** del tema del sistema
- ✅ **Todas las screens** actualizadas con tema

**Solo faltan las animaciones visuales** (FadeIn/FadeOut)

---

## 🚀 Opción 1: Development Build (Recomendado)

Para activar las animaciones necesitas crear un **development build** de Expo:

### Pasos:

```bash
# 1. Instalar EAS CLI globalmente
npm install -g eas-cli

# 2. Login en tu cuenta de Expo
eas login

# 3. Configurar el proyecto (primera vez)
eas build:configure

# 4. Crear development build para iOS
eas build --profile development --platform ios

# 5. O para Android
eas build --profile development --platform android

# 6. O para ambos
eas build --profile development --platform all
```

### Después del build:

1. Descarga la app desde el link que te dará EAS
2. Instálala en tu dispositivo/simulador
3. Descomenta el código de animaciones (ver abajo)
4. Ejecuta `npm start` y escanea el QR con tu nueva app

---

## 🔧 Opción 2: Local Development Build

Si prefieres compilar localmente:

### Para iOS (requiere Mac + Xcode):

```bash
# 1. Hacer prebuild
npx expo prebuild --platform ios

# 2. Instalar pods
cd ios && pod install && cd ..

# 3. Abrir Xcode y compilar
npx expo run:ios
```

### Para Android:

```bash
# 1. Hacer prebuild
npx expo prebuild --platform android

# 2. Compilar y ejecutar
npx expo run:android
```

---

## 📝 Descomentar el Código de Animaciones

Una vez tengas el development build, descomenta estas líneas:

### 1. `components/chat/MessageBubble.tsx`

```typescript
// LÍNEA 4-5: Descomentar
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// LÍNEA 57: Cambiar View por Animated.View
<Animated.View
  entering={isUser ? FadeInUp.duration(300).springify() : FadeInDown.duration(400).springify()}
  // ... resto del código

// LÍNEA 132: Cambiar </View> por </Animated.View>
</Animated.View>
```

### 2. `contexts/ThemeContext.tsx`

```typescript
// LÍNEA 14-15: Descomentar
import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';

// LÍNEA 26-27: Descomentar
themeTransition: any; // SharedValue<number> - 0 = light, 1 = dark

// LÍNEA 38-39: Descomentar
const themeTransition = useSharedValue(0);

// LÍNEA 68-73: Descomentar
useEffect(() => {
  themeTransition.value = withTiming(isDark ? 1 : 0, {
    duration: 300,
  });
}, [isDark, themeTransition]);

// LÍNEA 96-97: Descomentar
themeTransition,

// LÍNEA 99: Añadir themeTransition
[theme, themeMode, isDark, themeTransition]
```

---

## 🎯 Resultados Esperados

Con las animaciones activadas verás:

- ✨ **Mensajes del usuario**: Aparecen desde abajo (FadeInUp)
- ✨ **Mensajes del asistente**: Aparecen desde arriba (FadeInDown)
- ✨ **Transición de tema**: Cambio suave entre light/dark (300ms)
- ✨ **Efecto spring**: Rebote natural en las animaciones

---

## 📚 Documentación

- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/
- **Expo Development Builds**: https://docs.expo.dev/develop/development-builds/introduction/
- **EAS Build**: https://docs.expo.dev/build/introduction/

---

## ❓ FAQ

### ¿Por qué no funciona con Expo Go?

Expo Go es una app genérica que contiene las librerías nativas más comunes, pero no incluye todas. `react-native-reanimated` requiere código nativo personalizado que solo está disponible en development builds.

### ¿Cuánto tarda el build?

- **EAS Build** (en la nube): 10-20 minutos
- **Local build**: 5-10 minutos (después del setup inicial)

### ¿Necesito pagar?

- **Cuenta gratuita de Expo**: 30 builds/mes
- **Local builds**: Gratis (requiere Xcode o Android Studio)

### ¿Puedo usar el dark mode sin animaciones?

¡Sí! Todo el sistema de dark mode funciona perfectamente sin las animaciones. Solo perdemos los efectos visuales de transición.

---

## 🎉 Alternativa: Usar sin Animaciones

Si prefieres no hacer el development build, puedes dejar el código como está. La app funciona perfectamente con dark mode, solo sin los efectos de animación.

---

**Última actualización**: 16 de Octubre de 2025
