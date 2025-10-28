# 📱 Guía Completa de Assets para PWA

Esta guía te ayudará a crear todos los assets visuales necesarios para que tu PWA luzca profesional en iOS y Android.

> ⚠️ **IMPORTANTE**: Los archivos actuales son PLACEHOLDERS temporales. Debes reemplazarlos con assets finales siguiendo esta guía.

---

## 📋 Tabla de Contenidos

1. [Iconos de Aplicación](#-iconos-de-aplicación)
2. [Iconos Maskable (Android)](#-iconos-maskable-android)
3. [Iconos de Shortcuts](#-iconos-de-shortcuts)
4. [Screenshots para App Stores](#-screenshots-para-app-stores)
5. [Herramientas Recomendadas](#-herramientas-recomendadas)
6. [Checklist Final](#-checklist-final)

---

## 🎨 Iconos de Aplicación

### Especificaciones Generales

**Tamaños necesarios:**

- ✅ 72x72px (Android small)
- ✅ 96x96px (Android medium)
- ✅ 128x128px (Android large)
- ✅ 144x144px (Android extra-large)
- ✅ 152x152px (iOS iPad)
- ✅ 192x192px (Android)
- ✅ 384x384px (Android)
- ✅ 512x512px (Android, mandatory)

**Requisitos:**

- Formato: **PNG-24** (con transparencia)
- Espacio de color: **sRGB**
- Fondo: Puede ser transparente o con color de marca
- Resolución: **72 DPI mínimo**

### Diseño Recomendado

```
┌─────────────────┐
│   🎨 LOGO       │  ← Logo/ícono centrado
│   PARROQUIA     │  ← Ocupa ~80% del espacio
│                 │  ← Márgenes de seguridad 10%
└─────────────────┘
```

**Elementos visuales sugeridos:**

- Cruz o símbolo religioso
- Nombre "Parroquia" (opcional, mejor solo ícono)
- Colores: Azul (#3B82F6), Dorado (#F59E0B), o Púrpura litúrgico (#8B5CF6)
- Estilo: Moderno, minimalista, fácil de reconocer

### Crear en Canva

1. **Crear nuevo diseño**
   - Dimensiones: 512x512px
   - Fondo: Color sólido o transparente

2. **Diseñar el ícono**
   - Usar elementos de la biblioteca de Canva
   - Mantener diseño simple y legible
   - Probar cómo se ve pequeño (72px)

3. **Exportar**
   - Formato: PNG
   - Calidad: Máxima
   - Descargar como "icon-512x512.png"

4. **Redimensionar para otros tamaños**
   - Usa el comando siguiente en Terminal:
   ```bash
   cd public/icons
   sips -z 72 72 icon-512x512.png --out icon-72x72.png
   sips -z 96 96 icon-512x512.png --out icon-96x96.png
   sips -z 128 128 icon-512x512.png --out icon-128x128.png
   sips -z 144 144 icon-512x512.png --out icon-144x144.png
   sips -z 152 152 icon-512x512.png --out icon-152x152.png
   sips -z 192 192 icon-512x512.png --out icon-192x192.png
   sips -z 384 384 icon-512x512.png --out icon-384x384.png
   ```

### Crear con IA (ChatGPT/DALL-E, Midjourney)

**Prompt sugerido:**

```
Create a modern, minimalist app icon for a Catholic parish app.
512x512px, PNG format. Design should include:
- A simple cross or religious symbol
- Clean, modern aesthetic
- Primary color: blue (#3B82F6)
- Background: white or light gradient
- Centered design with 10% margins
- Professional, trustworthy appearance
```

**Post-procesamiento:**

- Asegúrate de que sea exactamente 512x512px
- Verifica que el fondo sea el deseado (transparente o color)
- Usa el script de redimensionamiento arriba

---

## 🔷 Iconos Maskable (Android)

### ¿Qué son los Maskable Icons?

Android puede aplicar diferentes formas a los iconos (círculo, cuadrado redondeado, etc.). Los iconos maskable se adaptan a estas formas.

### Especificaciones

**Zona de seguridad (Safe Zone):**

```
┌───────────────────────┐
│ ┌─────────────────┐   │
│ │                 │   │  ← 10% padding
│ │   CONTENIDO     │   │  ← Área segura (80%)
│ │   SEGURO        │   │  ← Visible en TODAS las formas
│ │                 │   │
│ └─────────────────┘   │
│                       │  ← 10% padding extra
└───────────────────────┘
```

**Tamaños necesarios:**

- ✅ 192x192px (mínimo requerido)
- ✅ 512x512px (recomendado)

**Reglas de diseño:**

1. **El contenido crítico debe estar en el círculo central (80% del ancho)**
2. Puedes usar el área externa (20%) para degradados o efectos
3. Nada importante debe estar a menos de 52px del borde (en un icono de 512px)

### Crear Maskable Icons en Canva

1. **Abrir el icono original** (512x512px)

2. **Añadir guías visuales**
   - Dibuja un círculo de 410x410px centrado (zona segura)
   - Todo lo importante debe estar dentro de este círculo

3. **Opciones de diseño:**

   **Opción A - Fondo de color completo:**

   ```
   ┌─────────────────┐
   │░░░░░░░░░░░░░░░░░│  ← Fondo de color hasta bordes
   │░░░┌─────┐░░░░░░│  ← Logo/cruz centrado
   │░░░│  +  │░░░░░░│  ← En zona segura (80%)
   │░░░└─────┘░░░░░░│
   │░░░░░░░░░░░░░░░░░│
   └─────────────────┘
   ```

   **Opción B - Gradiente extendido:**

   ```
   ┌─────────────────┐
   │╔═══════════════╗│  ← Gradiente sutil en bordes
   │║   ┌─────┐     ║│  ← Logo centrado
   │║   │  +  │     ║│  ← Zona segura
   │║   └─────┘     ║│
   │╚═══════════════╝│
   └─────────────────┘
   ```

4. **Exportar**
   - Guardar como PNG
   - Sin transparencia (fondo completo)
   - Nombre: "icon-maskable-512.png"

5. **Redimensionar:**

   ```bash
   cd public/icons
   sips -z 192 192 icon-maskable-512.png --out icon-maskable-192.png
   ```

6. **Actualizar manifest.json**
   - Cambiar purpose de "any" a "any maskable" para estos iconos:
   ```json
   {
     "src": "/icons/icon-maskable-192.png",
     "sizes": "192x192",
     "type": "image/png",
     "purpose": "any maskable"
   },
   {
     "src": "/icons/icon-maskable-512.png",
     "sizes": "512x512",
     "type": "image/png",
     "purpose": "any maskable"
   }
   ```

### Probar Maskable Icons

🔗 **Maskable.app**: https://maskable.app/editor

1. Sube tu icono maskable
2. Prueba diferentes formas (círculo, cuadrado, squircle)
3. Verifica que todo lo importante sea visible
4. Ajusta si es necesario

---

## 🔖 Iconos de Shortcuts

Los shortcuts aparecen al mantener presionado el ícono de la app (long-press).

### Especificaciones

**Tamaños:**

- ✅ 96x96px (todos los shortcuts)

**Archivos necesarios:**

- `shortcut-home.png` - Pantalla de inicio (evangelio)
- `shortcut-chat.png` - Chat con IA
- `shortcut-calendar.png` - Calendario de eventos
- `shortcut-settings.png` - Ajustes

### Diseño Recomendado

Cada shortcut debe ser visualmente distinto con su propio color:

```
HOME (Azul #3B82F6)          CHAT (Verde #10B981)
┌──────────┐                 ┌──────────┐
│ 📖       │                 │ 💬       │
│   EVAN   │                 │   CHAT   │
└──────────┘                 └──────────┘

CALENDAR (Púrpura #8B5CF6)   SETTINGS (Gris #6B7280)
┌──────────┐                 ┌──────────┐
│ 📅       │                 │ ⚙️       │
│   CAL    │                 │   SET    │
└──────────┘                 └──────────┘
```

### Crear en Canva

1. **Crear diseño** 96x96px

2. **Para cada shortcut:**
   - Fondo: Color del tab correspondiente
   - Ícono/emoji: Representativo (libro, chat, calendario, engranaje)
   - Estilo: Redondeado (border-radius 20px si es forma)
   - Texto: Opcional, mejor solo ícono

3. **Paleta de colores:**

   ```
   Home:     #3B82F6 (Azul)     → 📖 Libro
   Chat:     #10B981 (Verde)    → 💬 Chat
   Calendar: #8B5CF6 (Púrpura)  → 📅 Calendario
   Settings: #6B7280 (Gris)     → ⚙️ Ajustes
   ```

4. **Exportar** cada uno con su nombre correspondiente

### Crear con IA

**Prompt para cada shortcut:**

```
Create a 96x96px app shortcut icon for [HOME/CHAT/CALENDAR/SETTINGS].
- Background color: [COLOR]
- Icon: [DESCRIPTION]
- Style: Rounded corners (20px radius), modern, flat design
- Format: PNG with transparency or solid background
```

**Ejemplo para Home:**

```
Create a 96x96px app shortcut icon for a Gospel reading feature.
- Background color: #3B82F6 (blue)
- Icon: Open book or Bible icon in white
- Style: Rounded corners, modern, minimalist
- Format: PNG
```

---

## 📸 Screenshots para App Stores

Los screenshots se muestran en:

- Chrome Web Store (si publicas ahí)
- Instalación de PWA en algunos navegadores
- Futuras tiendas de apps

### Especificaciones

**Tamaños necesarios:**

- ✅ 540x720px (narrow, para manifest)
- 📱 750x1334px (iPhone 8 - recomendado)
- 📱 1170x2532px (iPhone 13/14/15 - opcional)

**Archivos necesarios:**

- `home-narrow.png` - Pantalla principal
- `calendar-narrow.png` - Vista de calendario
- `chat-narrow.png` - Chat con asistente

### Cómo Tomar Screenshots Reales

#### Opción A: Desde el iPhone (RECOMENDADO)

1. **Instalar la PWA en tu iPhone**
   - Abre la app en Safari
   - Toca el botón "Compartir"
   - Selecciona "Añadir a pantalla de inicio"

2. **Abrir la PWA instalada**
   - Abre desde la pantalla de inicio (NO Safari)

3. **Tomar screenshots**
   - Navega a cada pestaña (Home, Calendar, Chat)
   - Presiona **Volume Up + Power** simultáneamente
   - Las imágenes se guardan en Fotos

4. **Transferir al Mac**
   - AirDrop, iCloud Photos, o cable USB
   - Coloca en `public/screenshots/`

5. **Redimensionar para manifest**

   ```bash
   cd public/screenshots
   # Renombrar primero los archivos iPhone
   mv IMG_1234.PNG home-original.png
   mv IMG_1235.PNG calendar-original.png
   mv IMG_1236.PNG chat-original.png

   # Redimensionar a 540x720 para manifest
   sips -z 720 540 home-original.png --out home-narrow.png
   sips -z 720 540 calendar-original.png --out calendar-narrow.png
   sips -z 720 540 chat-original.png --out chat-narrow.png
   ```

#### Opción B: Mockup en Canva

Si prefieres crear mockups diseñados:

1. **Buscar template de iPhone** en Canva
   - Busca "iPhone mockup" o "app screenshot"
   - Selecciona uno con marco de iPhone

2. **Insertar screenshots**
   - Toma screenshots en el navegador (cmd+shift+4)
   - Insértalos en el template del iPhone

3. **Opciones de diseño:**
   - Solo la pantalla (sin marco) → Más limpio
   - Con marco de iPhone → Más visual
   - Añadir texto descriptivo → Para presentaciones

4. **Exportar**
   - 750x1334px (tamaño iPhone 8)
   - PNG de alta calidad

### Labels para Screenshots

En `manifest.json`, asegúrate de tener buenos labels:

```json
"screenshots": [
  {
    "src": "/screenshots/home-narrow.png",
    "sizes": "540x720",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Pantalla principal con evangelio y santo del día"
  },
  {
    "src": "/screenshots/calendar-narrow.png",
    "sizes": "540x720",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Calendario de eventos parroquiales"
  },
  {
    "src": "/screenshots/chat-narrow.png",
    "sizes": "540x720",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Chat con asistente IA"
  }
]
```

---

## 🛠️ Herramientas Recomendadas

### Diseño

1. **Canva** (Fácil, recomendado para principiantes)
   - 🔗 https://www.canva.com
   - Templates prediseñados
   - Interfaz intuitiva
   - Gratis con limitaciones

2. **Figma** (Profesional, más control)
   - 🔗 https://www.figma.com
   - Gratis para proyectos pequeños
   - Colaborativo
   - Más curva de aprendizaje

3. **IA Generativa**
   - ChatGPT con DALL-E
   - Midjourney (requiere Discord + suscripción)
   - Leonardo.ai (gratis limitado)

### Edición/Redimensionamiento

1. **sips** (Terminal macOS - YA INSTALADO)

   ```bash
   # Redimensionar
   sips -z HEIGHT WIDTH input.png --out output.png

   # Ejemplo: 512x512 → 192x192
   sips -z 192 192 icon-512x512.png --out icon-192x192.png
   ```

2. **ImageMagick** (Más potente, requiere instalación)

   ```bash
   brew install imagemagick

   # Redimensionar manteniendo proporción
   convert input.png -resize 192x192 output.png
   ```

3. **Online Image Resizer**
   - 🔗 https://imageresizer.com
   - Sin instalación
   - Sencillo de usar

### Verificación

1. **Maskable.app** - Probar iconos maskable
   - 🔗 https://maskable.app/editor

2. **Favicon Generator** - Generar todos los tamaños
   - 🔗 https://realfavicongenerator.net

3. **PWA Builder** - Validar manifest y assets
   - 🔗 https://www.pwabuilder.com

---

## ✅ Checklist Final

### Antes de Reemplazar Assets

- [ ] He diseñado el ícono principal (512x512px)
- [ ] He generado todos los tamaños de iconos (72px - 512px)
- [ ] He creado versiones maskable (192px y 512px)
- [ ] He probado los maskable en https://maskable.app
- [ ] He creado los 4 iconos de shortcuts (96x96px)
- [ ] He tomado screenshots reales desde iPhone
- [ ] He redimensionado screenshots a 540x720px
- [ ] Todos los archivos son PNG-24
- [ ] Los archivos tienen los nombres correctos

### Archivos a Reemplazar

Ubicación: `public/icons/`

**Iconos principales:**

- [ ] `icon-72x72.png`
- [ ] `icon-96x96.png`
- [ ] `icon-128x128.png`
- [ ] `icon-144x144.png`
- [ ] `icon-152x152.png`
- [ ] `icon-192x192.png`
- [ ] `icon-384x384.png`
- [ ] `icon-512x512.png`

**Iconos maskable:**

- [ ] `icon-maskable-192.png` (o actualizar manifest para usar icon-192x192.png con purpose "any maskable")
- [ ] `icon-maskable-512.png` (o actualizar manifest para usar icon-512x512.png con purpose "any maskable")

**Shortcuts:**

- [ ] `shortcut-home.png`
- [ ] `shortcut-chat.png`
- [ ] `shortcut-calendar.png`
- [ ] `shortcut-settings.png`

Ubicación: `public/screenshots/`

- [ ] `home-narrow.png`
- [ ] `calendar-narrow.png`
- [ ] `chat-narrow.png`

### Después de Reemplazar

- [ ] He verificado que todos los archivos se muestran correctamente
- [ ] He probado en iPhone (Safari → Añadir a pantalla de inicio)
- [ ] He probado en Android (Chrome → Instalar app)
- [ ] Los shortcuts funcionan correctamente
- [ ] Los iconos se ven bien en ambos sistemas
- [ ] He hecho commit y push de los nuevos assets
- [ ] He verificado que Vercel deployó correctamente

---

## 🚀 Deploy de Nuevos Assets

Una vez que hayas reemplazado todos los archivos:

1. **Verificar localmente**

   ```bash
   npm run dev
   # Abre http://localhost:3000 y verifica que los iconos se ven bien
   ```

2. **Commit y push**

   ```bash
   git add public/icons/* public/screenshots/*
   git commit -m "✨ Actualizar assets PWA con diseño final"
   git push
   ```

3. **Verificar en producción**
   - Espera ~1-2 minutos para que Vercel despliegue
   - Abre tu dominio de producción
   - En iPhone: Elimina la PWA anterior
   - Reinstala la PWA (Safari → Compartir → Añadir a inicio)

4. **Forzar actualización de caché** (si es necesario)
   - En Chrome DevTools → Application → Clear storage
   - En Safari iPhone → Ajustes → Safari → Borrar historial y datos

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons - web.dev](https://web.dev/maskable-icon/)
- [PWA Icons - web.dev](https://web.dev/add-manifest/#icons)
- [App shortcuts - web.dev](https://web.dev/app-shortcuts/)

### Inspiración y Ejemplos

- [PWA Directory](https://pwa-directory.com) - Ejemplos de PWAs profesionales
- [Dribbble - App Icons](https://dribbble.com/search/app-icon) - Diseños de iconos
- [Icon Kitchen](https://icon.kitchen) - Generador automático de iconos

### Comunidad y Ayuda

- [PWA Slack Community](https://bit.ly/pwa-slack)
- [Stack Overflow - PWA Tag](https://stackoverflow.com/questions/tagged/progressive-web-apps)

---

## 🎯 Próximos Pasos

1. **Crear iconos** siguiendo esta guía
2. **Tomar screenshots** desde tu iPhone
3. **Reemplazar los placeholders** en `public/icons/` y `public/screenshots/`
4. **Actualizar manifest.json** si usas nombres diferentes
5. **Probar localmente** con `npm run dev`
6. **Deploy a producción** con git push
7. **Verificar en dispositivos reales** (iPhone + Android)

---

> 💡 **Tip**: No te preocupes por hacerlo perfecto la primera vez. Puedes iterar y mejorar los assets gradualmente. ¡Lo importante es que la app funcione y se vea profesional!

> 🎨 **Recuerda**: La consistencia visual es clave. Usa los mismos colores, estilo y diseño en todos los assets para crear una experiencia cohesiva.

---

**¿Preguntas o necesitas ayuda?** Revisa los recursos adicionales o consulta la documentación oficial de PWAs.

**Última actualización**: Octubre 2025 - PWA Standards 2025
