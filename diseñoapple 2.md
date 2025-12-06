# Manual Profesional: Diseño de Aplicaciones iOS con React Native y TypeScript

## Guía Completa Basada en Apple Human Interface Guidelines

---

Las aplicaciones iOS exitosas combinan diseño excepcional con implementación técnica precisa. Este manual integra los estándares oficiales de Apple con las mejores prácticas de React Native y TypeScript para crear aplicaciones que se vean y funcionen como apps nativas de iOS. Basado en las Human Interface Guidelines oficiales y el nuevo sistema de diseño **Liquid Glass** introducido en iOS 18, aprenderás a implementar cada aspecto del diseño iOS en tus proyectos React Native.

**Nota importante**: Aunque solicitaste información sobre iOS 26, actualmente iOS 18/19 representa las versiones más recientes disponibles en 2025. Este manual se basa en la documentación oficial más actualizada de Apple.

---

## 1. Principios fundamentales de diseño iOS

### El nuevo lenguaje: Liquid Glass

Apple introdujo **Liquid Glass** como la evolución más significativa en el diseño de software de la compañía. Este metamaterial digital revolucionario unifica el lenguaje de diseño de todas las plataformas Apple mientras proporciona una experiencia de usuario más dinámica y expresiva. Liquid Glass se caracteriza por **efectos de lente** que doblan y deforman la luz, **translucidez dinámica** que permite que el contenido brille a través mientras mantiene legibilidad, y **formas flotantes** redondeadas que se anidan en las curvas de los dispositivos modernos.

El sistema se fundamenta en tres principios rectores que transforman cómo diseñamos aplicaciones iOS:

**Establecer jerarquía**. Los controles y la navegación de Liquid Glass actúan como una capa funcional distinta que flota sobre el contenido de tu aplicación, creando una nueva dimensión de profundidad. Los elementos antes diseñados para pantallas rectangulares han sido rediseñados para respetar las esquinas redondeadas del hardware, liberando espacio valioso para el contenido. Los controles se agrupan en esta capa flotante, eliminando densidad visual y permitiendo que los usuarios se enfoquen en lo que realmente importa.

**Crear armonía**. La forma de los dispositivos modernos informa la curvatura, tamaño y forma de los elementos de UI, creando **concentricidad** y armonía visual. Las formas redondeadas están influenciadas por la geometría de los dedos, mejorando las interacciones táctiles naturales. Los controles pueden transformarse fluidamente para receder cuando el usuario quiere enfocarse en el contenido, creando transiciones elegantes entre estados.

**Mantener consistencia**. El diseño es universal en todas las plataformas Apple, facilitando más que nunca establecer consistencia para tus aplicaciones en iOS, iPadOS, macOS y watchOS. Esta unificación reduce la carga cognitiva para los usuarios que utilizan múltiples dispositivos Apple.

### Diseño centrado en lo humano

Apple utiliza deliberadamente el término "interfaz humana" en lugar de "interfaz de usuario" para enfatizar el enfoque centrado en las personas. Como explica la documentación oficial, "el término usuario puede tener un efecto clínico o anonimizante". Esta filosofía permea cada decisión de diseño: las aplicaciones deben poner a las personas primero, priorizando comunicación respetuosa y presentando contenido y funcionalidad de maneras que todos puedan acceder y entender.

Los principios esenciales que sirven como base para grandes diseños incluyen **feedback** (retroalimentación que ayuda a las personas a operar con confianza), **visibilidad** (la usabilidad mejora cuando los controles e información son claramente visibles), **consistencia** (patrones familiares ayudan a explorar información fácilmente), y **modelos mentales** (alinearse con la comprensión natural del mundo de las personas).

### Diseño inclusivo como valor fundamental

El diseño inclusivo no es una característica adicional sino un valor integrado. Las aplicaciones inclusivas cuentan historias diversas, evitan estereotipos, adoptan características de accesibilidad desde el inicio, se localizan para diferentes culturas, ofrecen personalización y respetan la privacidad. Como señala Apple, "aproximadamente 1 de cada 7 personas tiene alguna forma de discapacidad", y la discapacidad existe en un espectro que afecta a todos en diferentes momentos de sus vidas.

---

## 2. Sistema de colores y apariencia

### Colores semánticos dinámicos

El sistema de colores de iOS se basa en **colores semánticos** que describen el propósito del color en lugar de su valor específico. Estos colores se adaptan automáticamente entre modo claro y oscuro, diferentes configuraciones de accesibilidad y entornos de pantalla. Apple ajustó sutilmente toda la familia de colores del sistema en iOS 18 para que funcionen en armonía con Liquid Glass, mejorando la diferenciación de matices sin perder el espíritu optimista que los hace únicamente Apple.

**Colores de etiquetas** expresan jerarquía de información con cuatro variantes: `label` para texto principal con mayor contraste, `secondaryLabel` para subtítulos, `tertiaryLabel` para placeholder y contenido terciario, y `quaternaryLabel` para texto deshabilitado.

**Colores de fondo** proporcionan estructura jerárquica: `systemBackground` es el color base (blanco puro en modo claro, negro puro en oscuro), seguido de `secondarySystemBackground` y `tertiarySystemBackground` para niveles adicionales de jerarquía. Para vistas de tabla agrupadas existen variantes específicas: `systemGroupedBackground`, `secondarySystemGroupedBackground` y `tertiarySystemGroupedBackground`.

**Colores del sistema** se adaptan dinámicamente al contexto: `systemBlue`, `systemGreen`, `systemIndigo`, `systemOrange`, `systemPink`, `systemPurple`, `systemRed`, `systemTeal` y `systemYellow`. Estos colores no son puros sino ajustados cuidadosamente para armonizar con otros elementos del sistema.

**Crítico para implementación**: Apple no proporciona valores HEX/RGB exactos para colores semánticos porque son dinámicos y cambian según modo de apariencia, contexto del dispositivo, configuraciones de accesibilidad y espacio de color (Display P3 vs sRGB). Los desarrolladores deben usar las APIs del sistema para acceder a estos colores, nunca valores hardcodeados.

### Espacios de color

iOS soporta **sRGB** (espacio estándar) y **Display P3** (gama más amplia con rojos y verdes más saturados, disponible desde iPhone 7 y iPad Pro 9.7"). El sistema maneja automáticamente la conversión entre espacios de color según las capacidades del dispositivo.

---

## 3. Tipografía y Dynamic Type

### La familia San Francisco

**San Francisco** es la fuente tipográfica del sistema diseñada específicamente por Apple para todas sus plataformas. Esta fuente sans-serif neutral y flexible incluye características avanzadas como tamaños ópticos variables, rastreo dinámico automático y soporte para más de 150 idiomas.

**SF Pro** es la fuente del sistema para iOS, iPadOS, macOS y tvOS. Viene en 9 pesos (Ultralight, Thin, Light, Regular, Medium, Semibold, Bold, Heavy, Black) con versiones itálicas, small caps, fracciones, y numerales especiales. Desde iOS 13, SF Pro se unificó para manejar automáticamente ajustes ópticos según el tamaño, eliminando la necesidad de elegir entre SF Display y SF Text.

**SF Compact** está optimizada para watchOS, diseñada específicamente para tamaños pequeños y columnas estrechas. **SF Mono** es la fuente monoespaciada para entornos de código. **New York** es la fuente serif complementaria para títulos y contenido editorial.

### Estilos de texto y jerarquía

Apple proporciona estilos de texto predefinidos que escalan automáticamente con Dynamic Type:

- **Large Title**: Títulos grandes en navegación (Regular)
- **Title 1, 2, 3**: Jerarquía de títulos (Regular, actualizados de Light a Regular en iOS 18 para mayor audacia y claridad)
- **Headline**: Encabezados que se distinguen del contenido (Semibold)
- **Body**: Cuerpo de texto para lectura de múltiples líneas (Regular, estilo predeterminado)
- **Callout, Subheadline**: Variaciones para diferentes contextos (Regular)
- **Footnote, Caption 1, Caption 2**: Información secundaria y subtítulos (Regular)

La tipografía se refinó en iOS 18 para fortalecer claridad y estructura, ahora más audaz y alineada a la izquierda para mejorar legibilidad en momentos clave como alertas y onboarding.

### Dynamic Type: accesibilidad fundamental

Dynamic Type permite a los usuarios elegir su tamaño de texto preferido en todo el sistema. Existen **7 tamaños estándar** más **5 tamaños de accesibilidad adicionales** para personas con necesidades visuales, totalizando 12 tamaños. El sistema incluye tres variantes de interlineado: Tight (reduce 2 puntos), Standard (predeterminado) y Loose (aumenta 2 puntos).

**Cuatro principios clave** para implementar Dynamic Type correctamente: hacer dinámico la mayor cantidad posible de texto, usar todo el ancho de pantalla disponible, nunca truncar texto sino permitir múltiples líneas (`numberOfLines = 0`), y escalar glifos e íconos junto al texto para mantener equilibrio visual.

**Tamaño mínimo recomendado**: 11 puntos a distancia típica de visualización sin zoom, asegurando contraste adecuado entre fuente y fondo.

---

## 4. Espaciado, layout y dimensiones

### Sistema de espaciado

Apple no impone un sistema de grid rígido sino que utiliza Auto Layout basado en restricciones para diseño adaptativo. Los **márgenes estándar del sistema** son: 20 puntos entre vista y borde del superview, y 8 puntos entre vistas hermanas. Los **Layout Margins** posicionan contenido estándar, mientras que **Readability Margins** proporcionan márgenes adicionales en dispositivos grandes para restringir la longitud de línea y mejorar la lectura.

### Safe Area (Área Segura)

El **Safe Area** representa la porción de la vista que no está obstruida por barras, notch, esquinas redondeadas o home indicator. Los valores específicos de safe area insets se obtienen dinámicamente en tiempo de ejecución mediante APIs, nunca como valores fijos, ya que varían según el modelo de dispositivo.

### Dimensiones de componentes críticos

**Tap targets (objetivos táctiles)** deben medir mínimo **44 x 44 puntos** para todos los controles interactivos según las HIG de Apple. Esta es una regla fundamental: el área táctil debe ser de 44x44 pt, aunque el elemento visual puede ser más pequeño siempre que el área táctil total cumpla este mínimo. Para visionOS/spatial computing, el área mínima aumenta a 60 puntos.

**Dimensiones de barras estándar**:
- Navigation Bar: 44 puntos de contenido + 20 puntos de status bar = 64 puntos total
- Tab Bar: 49 puntos en iPhone, 56 puntos en iPad

**Resoluciones de pantalla** varían según el dispositivo. Los desarrolladores trabajan en **puntos** (UIKit points), no píxeles. Por ejemplo, iPhone 14 Pro tiene 393 x 852 puntos a escala @3x, resultando en 1179 x 2556 píxeles. El sistema maneja automáticamente la conversión entre puntos y píxeles según el factor de escala del dispositivo (@2x o @3x).

---

## 5. Componentes de interfaz de usuario

### Navigation Bars (Barras de navegación)

Las Navigation Bars en iOS 18 presentan una **apariencia de vidrio líquido**, flotando sobre el contenido con agrupación automática de elementos de botón en grupos visuales que comparten fondos de vidrio. La barra translúcida incluye título (centrado o alineado a izquierda), botón "Atrás" automático (chevron + título de pantalla anterior) y botones de acción opcionales. La barra permanece fija en la parte superior durante el scroll, con efectos de borde que mejoran la legibilidad cuando el contenido pasa detrás.

### Tab Bars (Barras de pestañas)

La Tab Bar flotante ahora sobre el contenido con Liquid Glass, puede minimizarse al hacer scroll para enfocar en el contenido. iOS 18 introduce una **pestaña de búsqueda dedicada** en el lado derecho, reconociendo que la búsqueda es esencial cuando el contenido no es visible inmediatamente. Soporta vistas accesorias para funciones persistentes como controles de reproducción. El número óptimo de pestañas es 3-5, con máximo 5 visibles (pestañas adicionales van a "Más").

### Botones y controles

Los botones deben cumplir con el tamaño táctil mínimo de 44x44 puntos. Los **Switches** (interruptores) miden 51x31 puntos en iOS. Los **Segmented Controls** presentan 2-5 opciones con selección exclusiva (estilo radio button) y transiciones suaves entre segmentos.

### Listas y tablas

Las tablas vienen en tres estilos: `.plain` (lista simple sin agrupación visual), `.grouped` (secciones agrupadas con espaciado), y `.insetGrouped` (grupos con margen lateral, introducido en iOS 13). La altura de fila estándar es mínimo 44 puntos. Las listas soportan swipe actions para acciones contextuales y pull-to-refresh para actualización de contenido.

### Modales y alertas

Las presentaciones modales en iOS 13+ incluyen gesto de deslizar hacia abajo para cerrar y barra de agarre visible en parte superior. Estilos de presentación incluyen `.pageSheet` (hoja con contenido padre visible), `.formSheet` (formulario centrado en iPad), `.fullScreen` (pantalla completa) y `.automatic` (determinado por sistema).

Las **Alertas** presentan fondo translúcido con título enfatizado, mensaje opcional y 1-3 botones. Tipos de botones: `.default` (acción estándar), `.cancel` (cancelación en bold) y `.destructive` (acción destructiva en rojo del sistema).

---

## 6. Iconografía: SF Symbols

### Sistema SF Symbols 7

**SF Symbols 7** (2025) es una biblioteca de más de **6,900 símbolos** diseñados para integrarse perfectamente con San Francisco. Los símbolos vienen en **9 pesos** y **3 escalas** (Small, Medium, Large), se alinean automáticamente con texto y son completamente vectoriales.

### Nuevas capacidades en SF Symbols 7

**Draw animations** (animaciones de dibujo) están inspiradas en el movimiento caligráfico de la escritura, incluyendo Draw On (símbolo aparece), Draw Off (símbolo desaparece), By Layer (capas con desplazamiento escalonado) y Whole Symbol (todas las capas juntas). **Variable Draw** permite renderizado variable para indicadores de progreso. Los **gradientes** renderizan automáticamente con gradiente lineal suave desde un solo color de origen. **Magic Replace mejorado** crea transiciones continuas entre símbolos relacionados.

### Modos de renderizado

- **Monochrome**: Un solo color uniforme y consistente
- **Hierarchical**: Múltiples opacidades del mismo color para énfasis sutil
- **Palette**: Múltiples colores personalizados (2-3 colores) con control completo
- **Multicolor**: Colores predefinidos por Apple para símbolos específicos

### Iconos de aplicación

Los iconos de aplicación en iOS 18 enfatizan el uso efectivo de **capas, translucidez y desenfoques**. Los principios clave incluyen layering para crear profundidad, translucency and blur para agregar matices y ligereza, simplicidad evitando bordes afilados y líneas delgadas, y material effects que crean un sentido de profundidad haciendo que los íconos parezcan iluminados desde dentro.

**Tamaños requeridos para iPhone**:
- 120x120 px (60pt @2x) - Pantalla inicio iPhone retina - **REQUERIDO**
- 180x180 px (60pt @3x) - Pantalla inicio iPhone retina HD - **REQUERIDO**
- 1024x1024 px - App Store - **REQUERIDO**

**Especificaciones técnicas**: Formato PNG obligatorio, color RGB (no CMYK), sin transparencia (debe ser opaco), esquinas cuadradas a 90° (el sistema aplica máscara redondeada), sin sombras incluidas (el sistema las añade).

---

## 7. Patrones de navegación

### Navegación por pestañas (Tab Bar Navigation)

La navegación por pestañas separa secciones de nivel superior de la app con una barra siempre visible en la parte inferior. Cada pestaña preserva su estado de navegación independiente. El número óptimo es 3-5 pestañas, con máximo 5 visibles. El comportamiento incluye cambio instantáneo entre pestañas, stack de navegación independiente por pestaña, icono relleno (filled) para pestaña activa y scroll to top al tocar pestaña activa.

### Navegación jerárquica

La navegación jerárquica explora contenido con estructura de árbol usando transiciones push (deslizamiento desde derecha) y pop (deslizamiento a izquierda). El gesto de edge swipe desde borde izquierdo permite volver atrás naturalmente. La Navigation Bar actualiza su título con cada nivel, y el botón "Atrás" muestra automáticamente el título de la pantalla anterior. Se recomienda máximo 3-4 niveles de profundidad para mantener claridad.

### Presentaciones modales

Las modales crean foco separando a las personas de la jerarquía de información. Son apropiadas cuando se requiere completar una tarea antes de continuar, la interfaz necesita ser editada y completada, o el resto de la aplicación no es necesario como referencia. Tipos de tareas modales incluyen simples (una sola acción con "Cancelar" y "Guardar"), multi-paso (flujo de trabajo secuencial con navegación interna) y pantalla completa (experiencia inmersiva como cámara o editor).

### Transiciones y animaciones

Las transiciones estándar incluyen **Push/Pop** (duración ~0.3 segundos, horizontal), **Modal Present/Dismiss** (duración ~0.3 segundos, vertical) y **Fade** (duración ~0.2 segundos, para cambios sutiles). Todas usan curvas de aceleración natural (ease-in-ease-out) y deben respetar la configuración "Reducir movimiento" para accesibilidad.

---

## 8. Dark Mode: implementación profesional

### Adopción automática de Dark Mode

Las aplicaciones compiladas con el SDK de iOS 13.0 o posterior se incluyen automáticamente en ambas apariencias (clara y oscura). Dark Mode no es simplemente una inversión de colores sino una adaptación sutil y cuidadosa. Los colores deben oscurecerse en Light Mode y aclararse en Dark Mode cuando se requiere mayor contraste para mantener legibilidad.

### Mejores prácticas de implementación

**Usar colores semánticos del sistema** es fundamental: estos cambian automáticamente con la apariencia. Evitar valores RGB codificados directamente y siempre probar la aplicación en ambos modos usando Environment Overrides en Xcode durante el desarrollo. Implementar variaciones de imágenes para cada modo cuando sea necesario usando asset catalogs con variantes de apariencia.

Para detectar la apariencia actual, usar `UITraitCollection.current.userInterfaceStyle` que devuelve `.light`, `.dark` o `.unspecified`. Cuando el usuario cambia entre modos, el sistema llama automáticamente a `traitCollectionDidChange(_:)` en todos los view controllers y views, permitiendo actualizar la UI apropiadamente.

**Colores específicos por modo**: En Dark Mode, `systemBackground` es negro puro (#000000) mientras que en Light Mode es blanco puro (#FFFFFF). El color `label` proporciona máximo contraste en ambos modos automáticamente. Los colores del sistema como `systemBlue` se ajustan sutilmente: en Light Mode es más oscuro (#007AFF) y en Dark Mode más brillante (#0A84FF) para mantener contraste adecuado.

---

## 9. Accesibilidad: estándares obligatorios

### VoiceOver: lector de pantalla fundamental

VoiceOver es el lector de pantalla basado en gestos que permite a personas ciegas o con baja visión interactuar con dispositivos Apple. **Todos los controles interactivos** deben tener etiquetas concisas y precisas que proporcionen equivalentes de texto. Las etiquetas deben tener sentido fuera de contexto, evitar ambigüedades como "Haga clic aquí" y nunca incluir el tipo de control en la etiqueta (será redundante).

**Accessibility Labels** describen brevemente el elemento. **Accessibility Hints** (opcionales) describen qué sucede cuando el usuario interactúa. **Accessibility Traits** comunican el tipo de elemento (button, header, link, etc.). **Accessibility Value** es para elementos con valores cambiantes como sliders o switches.

Los usuarios de VoiceOver deben poder navegar a cualquier elemento visible en orden lógico. Cuando aparece contenido modal, el cursor debe moverse lógicamente al nuevo área. El gesto de activación de VoiceOver (doble toque) debe activar el mismo comportamiento que un toque estándar.

### Dynamic Type obligatorio

Todas las aplicaciones deben soportar Dynamic Type correctamente. Usar estilos de texto del sistema (Body, Headline, etc.) en lugar de fuentes con tamaños fijos. Establecer `adjustsFontForContentSizeCategory = true` para actualización automática cuando el usuario cambia el tamaño de texto. Soportar los 12 tamaños (7 estándar + 5 accesibilidad). Nunca truncar texto: permitir múltiples líneas estableciendo `numberOfLines = 0`.

### Contraste de color: requisitos WCAG

El ratio de contraste mínimo es **4.5:1** entre texto y fondo según WCAG (Web Content Accessibility Guidelines). Para elementos no textuales (controles, estados de selección), el mínimo es **3.1:1**. Verificar contraste usando el **Color Contrast Calculator** del Accessibility Inspector de Xcode.

**Increase Contrast**: Cuando el usuario habilita esta configuración, los colores del sistema se actualizan automáticamente a apariencias de alto contraste. En Light Mode los colores deben oscurecerse, en Dark Mode deben aclararse. Detectar con `UIAccessibility.isDarkerSystemColorsEnabled`.

### Configuraciones adicionales de accesibilidad

**Bold Text** muestra el texto del sistema en negrita. **Reduce Transparency** ajusta efectos de desenfoque y transparencia a colores sólidos. **Reduce Motion** simplifica animaciones para usuarios sensibles al movimiento. **Differentiate Without Color** ayuda a usuarios con daltonismo agregando símbolos o patrones además del color para diferenciar elementos.

### Testing de accesibilidad obligatorio

Usar **Accessibility Inspector** de Xcode para realizar auditorías automáticas que detectan problemas como elementos sin descripción, contraste insuficiente, tamaño de toque inadecuado y texto no accesible. Implementar **auditorías automatizadas con XCTest** usando `app.performAccessibilityAudit()`. Probar siempre con VoiceOver en dispositivo físico, ya que el simulador tiene funcionalidad limitada.

**Lista de verificación esencial**: VoiceOver activado, Dynamic Type en diferentes tamaños (especialmente los 5 más grandes), Bold Text activado, Increase Contrast activado, Reduce Transparency activado, Reduce Motion activado, Differentiate Without Color activado, ambos Dark y Light Mode, y combinaciones de configuraciones.

---

## 10. Implementación en React Native con TypeScript

### Bibliotecas fundamentales para iOS

**React Navigation** proporciona navegación nativa con apariencia iOS. Usar `@react-navigation/native-stack` para mejor rendimiento que stack navigators basados en JavaScript:

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**React Native iOS Kit** proporciona componentes específicos de iOS como SegmentedControl, SearchBar y TabBar. **React Native Paper** ofrece componentes Material Design compatibles con iOS. **NativeBase** proporciona componentes universales con excelente soporte TypeScript.

### Usando colores nativos con PlatformColor

```typescript
import { Platform, PlatformColor, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' 
      ? PlatformColor('systemBackground')
      : '#FFFFFF',
  },
  label: {
    color: Platform.OS === 'ios'
      ? PlatformColor('label')
      : '#000000',
  },
  link: {
    color: Platform.OS === 'ios'
      ? PlatformColor('systemBlue')
      : '#0a84ff',
  },
});
```

**Colores dinámicos de iOS disponibles**: `systemBackground`, `secondarySystemBackground`, `label`, `secondaryLabel`, `systemBlue`, `systemRed`, `systemGreen`, `separator`, `link`, `placeholderText` y más. Estos colores se adaptan automáticamente al modo claro/oscuro y configuraciones de accesibilidad.

### Gestión de temas: implementación completa

```typescript
// ThemeContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';

interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#000000',
    border: '#C6C6C8',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();
    setIsDark(colorScheme === 'dark');

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};
```

### Código específico de plataforma iOS

**Usando Platform.select para estilos**:

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      ios: {
        backgroundColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        backgroundColor: '#FFFFFF',
        elevation: 4,
      },
    }),
  },
});
```

**Archivos específicos de plataforma**: Crear archivos con extensiones `.ios.tsx` y `.android.tsx`:

```
Button.ios.tsx    // Para iOS
Button.android.tsx // Para Android
Button.tsx        // Fallback
```

React Native carga automáticamente el archivo correcto al importar:

```typescript
import Button from './Button'; // Carga Button.ios.tsx en iOS
```

### Ejemplo completo: Lista con estilo iOS

```typescript
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PlatformColor,
} from 'react-native';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
}

interface IOSStyleListProps {
  data: Item[];
  onItemPress: (item: Item) => void;
}

const IOSStyleList: React.FC<IOSStyleListProps> = ({ data, onItemPress }) => {
  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        index === 0 && styles.firstItem,
        index === data.length - 1 && styles.lastItem,
      ]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.6}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('systemGroupedBackground')
      : '#F0F0F0',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('secondarySystemGroupedBackground')
      : '#FFFFFF',
  },
  firstItem: {
    borderTopLeftRadius: Platform.OS === 'ios' ? 10 : 0,
    borderTopRightRadius: Platform.OS === 'ios' ? 10 : 0,
  },
  lastItem: {
    borderBottomLeftRadius: Platform.OS === 'ios' ? 10 : 0,
    borderBottomRightRadius: Platform.OS === 'ios' ? 10 : 0,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    color: Platform.OS === 'ios'
      ? PlatformColor('label')
      : '#000000',
  },
  itemSubtitle: {
    fontSize: 15,
    color: Platform.OS === 'ios'
      ? PlatformColor('secondaryLabel')
      : '#666666',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: Platform.OS === 'ios'
      ? PlatformColor('separator')
      : '#C7C7C7',
    fontWeight: '300',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('separator')
      : '#E0E0E0',
    marginLeft: 16,
  },
});

export default IOSStyleList;
```

---

## 11. Optimización de rendimiento y animaciones

### Animaciones a 60+ FPS con Native Driver

El método más sencillo para mejorar el rendimiento de animaciones es usar `useNativeDriver: true`:

```typescript
import { Animated } from 'react-native';

const fadeAnim = new Animated.Value(0);

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 500,
  useNativeDriver: true, // CRUCIAL para 60 FPS
}).start();
```

**Propiedades compatibles con useNativeDriver**: `transform` (translate, rotate, scale) y `opacity`. **No funciona** con: colors, height, width (usar Reanimated para estos casos).

### React Native Reanimated para animaciones avanzadas

Reanimated ejecuta animaciones en UI thread (no en JS thread), soporta 120 FPS en dispositivos compatibles, puede animar TODAS las propiedades y tiene mejor integración con React Native Gesture Handler.

**Instalación**:

```bash
npm install react-native-reanimated react-native-worklets
```

**Configuración babel.config.js**:

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

**Ejemplo básico**:

```typescript
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle 
} from 'react-native-reanimated';

function AnimatedComponent() {
  const width = useSharedValue(100);
  
  const handlePress = () => {
    width.value = withSpring(width.value + 50);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));
  
  return (
    <View>
      <Animated.View style={[styles.box, animatedStyle]} />
      <Button title="Animate" onPress={handlePress} />
    </View>
  );
}
```

**Layout Animations** para entradas/salidas:

```typescript
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

function AnimatedList({ items }) {
  return (
    <View>
      {items.map(item => (
        <Animated.View
          key={item.id}
          entering={FadeIn}
          exiting={FadeOut}
          layout={Layout.springify()}
        >
          <Text>{item.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
```

### Optimización de listas largas

**Usar FlatList con optimizaciones críticas**:

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  // Optimizaciones críticas:
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
/>
```

**Alternativas de alto rendimiento**: **FlashList** de Shopify y **Legend List** para listas con cientos o miles de elementos.

### Reducir overhead del JavaScript Bridge

Minimizar comunicación entre JavaScript y nativo usando **InteractionManager** para operaciones pesadas:

```typescript
import { InteractionManager } from 'react-native';

function handleOnPress() {
  requestAnimationFrame(() => {
    InteractionManager.runAfterInteractions(() => {
      // Operaciones pesadas aquí
      this.doExpensiveAction();
    });
  });
}
```

Eliminar `console.log` en producción usando babel-plugin-transform-remove-console. Agrupar actualizaciones y evitar pasar objetos grandes a través del bridge.

### Optimización de imágenes

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable
  }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**Mejores prácticas**: Usar formato WebP (reduce tamaño ~30%), optimizar resoluciones para cada dispositivo (@2x y @3x), implementar lazy loading y usar herramientas como react-native-compressor.

### Prevenir re-renders innecesarios

```typescript
import React, { memo, useCallback, useMemo } from 'react';

const MyComponent = memo(({ value, onPress }) => {
  return (
    <View>
      <Text>{value}</Text>
      <Button onPress={onPress} title="Press" />
    </View>
  );
});

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  const handlePress = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(count);
  }, [count]);
  
  return <MyComponent value={expensiveValue} onPress={handlePress} />;
};
```

**Advertencia**: No sobre-optimizar. Usar memoización solo cuando sea necesario tras identificar problemas de rendimiento.

### Habilitar Hermes Engine

Hermes reduce el tiempo de arranque y el uso de memoria hasta 30%:

```javascript
// android/app/build.gradle
project.ext.react = [
    enableHermes: true
]

// ios/Podfile
use_react_native!(
  :hermes_enabled => true
)
```

---

## 12. Módulos nativos: cuándo y cómo usarlos

### Casos de uso para módulos nativos

Crear módulos nativos cuando necesitas acceso a APIs específicas de plataforma no disponibles en React Native (HealthKit, ARKit, sensores específicos), rendimiento crítico (procesamiento de imágenes, operaciones matemáticas pesadas), reutilizar código existente en Swift/Objective-C, o integraciones con SDKs nativos de terceros.

### Crear módulo nativo en iOS (Swift + TypeScript)

**Paso 1: Crear archivo Swift**:

```swift
// NetworkStatusModule.swift
import Foundation
import Network

@objc(NetworkStatus)
class NetworkStatus: RCTEventEmitter {
  
  @objc
  static override func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["networkStatusChanged"]
  }
  
  @objc
  func checkConnection(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve("connected")
  }
}
```

**Paso 2: Crear archivo Objective-C de puente**:

```objective-c
// NetworkStatus.m
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NetworkStatus, RCTEventEmitter)
RCT_EXTERN_METHOD(checkConnection:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
```

**Paso 3: Usar en TypeScript**:

```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

interface NetworkStatusModule {
  checkConnection(): Promise<string>;
}

const { NetworkStatus } = NativeModules as { NetworkStatus: NetworkStatusModule };
const networkEmitter = new NativeEventEmitter(NetworkStatus as any);

// Usar promesas
NetworkStatus.checkConnection()
  .then(status => console.log(status))
  .catch(error => console.error(error));

// Escuchar eventos
networkEmitter.addListener('networkStatusChanged', (event) => {
  console.log('Status:', event.status);
});
```

---

## 13. Testing visual y QA

### Visual Regression Testing con React Native Owl

React Native Owl permite testing visual automático comparando screenshots:

**Instalación**:

```bash
yarn add -D react-native-owl
```

**Configuración (owl.config.json)**:

```json
{
  "ios": {
    "workspace": "ios/YourApp.xcworkspace",
    "scheme": "YourApp",
    "configuration": "Release",
    "device": "iPhone 14"
  },
  "report": true
}
```

**Escribir tests (App.owl.tsx)**:

```typescript
import { takeScreenshot } from 'react-native-owl';

describe('App Visual Tests', () => {
  it('renders home screen correctly', async () => {
    await takeScreenshot('home-screen');
  });
  
  it('renders gallery after button press', async () => {
    await device.press({ testID: 'open-gallery-button' });
    await takeScreenshot('gallery-screen');
  });
});
```

**Ejecutar tests**:

```bash
yarn owl build --platform ios
yarn owl test --platform ios
yarn owl test --platform ios --update  # Actualizar baseline
```

### Testing en diferentes dispositivos iOS

**Dispositivos esenciales para probar**: iPhone SE (pantalla pequeña), iPhone 14/15 (estándar), iPhone 14 Pro Max/15 Pro Max (pantalla grande), iPad (diferentes orientaciones).

**Usar simuladores específicos**:

```bash
# Listar simuladores disponibles
xcrun simctl list devices

# Ejecutar en simulador específico
npx react-native run-ios --simulator="iPhone 14 Pro"

# Demo Mode para screenshots consistentes
xcrun simctl status_bar "iPhone 14" override --time "9:41"
```

---

## 14. Errores comunes a evitar

### Ignorar diferencias de plataforma

**Error**: Asumir que el mismo componente funciona igual en iOS y Android sin ajustes específicos.

**Solución**: Siempre usar `Platform.select()` o `Platform.OS` para aplicar estilos y comportamientos específicos de iOS.

### No optimizar imágenes

**Error**: Usar imágenes PNG de alta resolución sin optimizar.

**Solución**: Usar WebP, comprimir apropiadamente, implementar react-native-fast-image y lazy loading.

### Abusar de librerías de terceros

**Error**: Instalar múltiples librerías sin evaluar necesidad real.

**Solución**: Evaluar cada librería (mantenimiento, comunidad, impacto en tamaño), considerar implementar funcionalidades simples nativamente.

### No usar keys apropiadas en listas

**Error**: `{items.map((item, index) => <Item key={index} />)}`

**Solución**: `{items.map(item => <Item key={item.id} />)}` usando IDs únicos y estables.

### No eliminar console.log en producción

**Error**: Dejar console.log en código de producción reduce rendimiento significativamente.

**Solución**: Usar babel-plugin-transform-remove-console o condicionales `if (__DEV__)`.

### Mutación directa de estado

**Error**: `items.push(4)` muta el estado directamente.

**Solución**: `setItems([...items, 4])` crea un nuevo array respetando inmutabilidad.

### No gestionar memoria correctamente

**Error**: No limpiar listeners y subscripciones al desmontar componentes.

**Solución**: Siempre retornar función de limpieza en `useEffect`:

```typescript
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  return () => subscription.remove(); // Limpiar
}, []);
```

---

## Conclusión: la excelencia en diseño iOS

Crear aplicaciones React Native indistinguibles de aplicaciones nativas de iOS requiere dominar tres pilares fundamentales: comprender profundamente las Human Interface Guidelines de Apple y el sistema de diseño Liquid Glass, implementar correctamente todos los estándares de diseño visual (colores semánticos, tipografía San Francisco, Dynamic Type, espaciado apropiado), y optimizar meticulosamente el rendimiento usando herramientas como Reanimated y Native Driver.

La accesibilidad no es opcional sino obligatoria: VoiceOver debe funcionar perfectamente, Dynamic Type debe soportar todos los tamaños, el contraste de color debe cumplir WCAG 4.5:1 mínimo, y todas las configuraciones de accesibilidad deben estar implementadas. El soporte para Dark Mode debe ser automático usando colores semánticos del sistema.

Las mejores aplicaciones React Native para iOS son aquellas que los usuarios no pueden distinguir de aplicaciones nativas puras. Esto se logra siguiendo rigurosamente las HIG de Apple, usando componentes apropiados de bibliotecas como React Navigation y React Native iOS Kit, implementando código específico de plataforma cuando sea necesario, y optimizando incansablemente el rendimiento hasta alcanzar 60+ FPS consistentes.

El testing visual con herramientas como React Native Owl, combinado con testing riguroso de accesibilidad usando Accessibility Inspector y VoiceOver en dispositivos físicos, asegura que tu aplicación mantenga la calidad excepcional que los usuarios de iOS esperan.

Este manual te proporciona todo el conocimiento técnico necesario. El siguiente paso es implementar estos principios en tu proyecto, iterando constantemente basándote en feedback de usuarios reales y manteniendo un compromiso inquebrantable con la excelencia en diseño y rendimiento.

---

## Recursos oficiales fundamentales

**Apple Developer**:
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Apple Design Resources: https://developer.apple.com/design/resources/
- SF Symbols 7: https://developer.apple.com/sf-symbols/
- WWDC 2025 Videos: Meet Liquid Glass, Get to know the new design system

**React Native**:
- Documentación oficial: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/

**Bibliotecas esenciales**:
- React Native iOS Kit: https://callstack.github.io/react-native-ios-kit/
- React Native Paper: https://reactnativepaper.com/
- NativeBase: https://nativebase.io/
- React Native Fast Image: https://github.com/DylanVann/react-native-fast-image
- React Native Owl: https://github.com/FormidableLabs/react-native-owl

**Comunidad y aprendizaje**:
- Callstack Blog: https://www.callstack.com/blog
- Software Mansion: https://swmansion.com/
- React Native Community: https://github.com/react-native-community