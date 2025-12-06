# 🚀 Guía de Despliegue del Backend en Vercel

Esta guía te ayudará a desplegar el backend de tu aplicación de Parroquias en Vercel para que el chat con IA funcione correctamente.

## 📋 Requisitos Previos

1. Una cuenta en [vercel.com](https://vercel.com) (puedes usar tu cuenta de GitHub)
2. Tu API key de OpenAI (de [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
3. Tu Workflow ID de Agent Builder (empieza con `wf_...`)

## 🎯 Paso 1: Preparar el Repositorio

### Opción A: Subir a GitHub (Recomendado)

1. Crea un nuevo repositorio en GitHub
2. Desde la carpeta raíz de tu proyecto:

```bash
# Si aún no has inicializado git
git init
git add .
git commit -m "Initial commit con backend"

# Conecta con tu repositorio de GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### Opción B: Usar Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde la carpeta backend
cd backend
vercel
```

## 🌐 Paso 2: Desplegar en Vercel

### Si usaste GitHub:

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Busca y selecciona tu repositorio de GitHub
4. En **Root Directory**, selecciona `backend`
5. Vercel detectará automáticamente que es un proyecto Next.js
6. **NO HAGAS CLICK EN DEPLOY TODAVÍA**

### Si usaste Vercel CLI:

El CLI te guiará por el proceso. Responde:
- **Set up and deploy?** → Yes
- **Which scope?** → Tu cuenta personal
- **Link to existing project?** → No
- **Project name?** → parroquias-backend (o el que prefieras)
- **Directory?** → ./
- **Override settings?** → No

## ⚙️ Paso 3: Configurar Variables de Entorno

Esto es **MUY IMPORTANTE** - sin estas variables el backend no funcionará.

### En el Dashboard de Vercel:

1. En la página de configuración del proyecto, ve a **"Environment Variables"**
2. Añade las siguientes variables:

| Name | Value | Dónde conseguirla |
|------|-------|-------------------|
| `OPENAI_API_KEY` | `sk-proj-xxx...` | Ya la tienes en tu .env actual |
| `CHATKIT_WORKFLOW_ID` | `ywf_68ed475f...` | Ya la tienes en tu .env actual |

3. Para cada variable:
   - Click en **"Add New"**
   - Name: Escribe el nombre exacto
   - Value: Pega el valor
   - Environments: Selecciona **Production**, **Preview** y **Development**
   - Click en **"Save"**

### Valores que debes usar:

Desde tu archivo `.env` actual:

```env
OPENAI_API_KEY=tu_openai_api_key_aqui

CHATKIT_WORKFLOW_ID=tu_workflow_id_aqui
```

⚠️ **Nota importante sobre el Workflow ID:**
- Tu workflow ID actual empieza con `ywf_`, no con `wf_`
- Esto es correcto, úsalo tal cual

## 🚀 Paso 4: Desplegar

1. Una vez configuradas las variables de entorno, click en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel construye tu proyecto
3. Verás un mensaje de "Congratulations!" cuando termine

## 🔗 Paso 5: Obtener tu URL

Una vez desplegado, Vercel te dará una URL como:

```
https://parroquias-backend.vercel.app
```

O algo similar con tu nombre de proyecto.

## 📱 Paso 6: Actualizar la App Móvil

Ahora necesitas actualizar tu app para que use el backend desplegado:

1. Abre el archivo `.env` en la raíz de tu proyecto (NO el del backend)
2. Actualiza la variable `EXPO_PUBLIC_API_BASE`:

```env
# ANTES (vacío o localhost)
EXPO_PUBLIC_API_BASE=http://localhost:3000

# DESPUÉS (URL de tu backend en Vercel)
EXPO_PUBLIC_API_BASE=https://tu-proyecto.vercel.app
```

3. Guarda el archivo
4. Reinicia tu app Expo:

```bash
# Presiona 'r' en la terminal de Expo, o
npx expo start --clear
```

## ✅ Paso 7: Verificar que Funciona

1. Abre tu app
2. Presiona "Test Login" para entrar
3. Ve a la pestaña "Chat"
4. Envía un mensaje
5. Deberías recibir una respuesta de tu agente de OpenAI

## 🐛 Troubleshooting

### Error: "CHATKIT_WORKFLOW_ID no está configurado"

**Solución:**
- Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables
- Verifica que `CHATKIT_WORKFLOW_ID` esté añadida
- Re-despliega: Deployments → Click en los tres puntos → "Redeploy"

### Error: "Unauthorized" o 401

**Solución:**
- Verifica que `OPENAI_API_KEY` sea correcta
- Asegúrate de que la API key sea del mismo organization que tu Agent Builder
- Verifica que no haya espacios extra al copiar/pegar

### Error: "Workflow not found"

**Solución:**
- Ve a [platform.openai.com/agent-builder](https://platform.openai.com/agent-builder)
- Abre tu workflow
- Verifica que esté **Publicado** (botón "Publish" en la esquina superior derecha)
- Copia nuevamente el Workflow ID después de publicar

### La app sigue usando la implementación vieja

**Solución:**
- Asegúrate de haber actualizado `EXPO_PUBLIC_API_BASE` con la URL de Vercel
- Reinicia Expo con `npx expo start --clear`
- En iOS Simulator: Cmd+D → Reload
- En Android: Cmd+M → Reload

## 🔄 Actualizar el Backend

Si haces cambios en el código del backend:

1. **Desde GitHub:**
   - Haz `git push` de tus cambios
   - Vercel desplegará automáticamente

2. **Desde Vercel CLI:**
   ```bash
   cd backend
   vercel --prod
   ```

## 💰 Costos

- **Vercel:** Plan gratuito (suficiente para desarrollo y producción inicial)
- **OpenAI API:** Pagas por uso según los mensajes enviados

## 🔒 Seguridad

✅ **Buenas prácticas implementadas:**
- API keys solo en el servidor (nunca expuestas en la app)
- CORS configurado para aceptar requests de cualquier origen
- Variables de entorno separadas por ambiente

⚠️ **Para producción:**
- Considera restringir CORS solo a tu dominio
- Añade rate limiting para prevenir abuso
- Monitorea el uso de tu API key de OpenAI

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [OpenAI Agent Builder](https://platform.openai.com/docs/guides/agent-builder)
- [OpenAI ChatKit](https://platform.openai.com/docs/guides/chatkit)

---

¿Necesitas ayuda? Revisa los logs en:
- **Vercel:** Dashboard → Tu proyecto → Deployments → Click en el deployment → View Function Logs
- **App móvil:** Consola de Expo donde corre tu app
