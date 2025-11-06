# 🔧 Sentry en Vercel - Guía de Configuración

**Fecha**: 6 Noviembre 2025
**Estado**: ✅ Código re-habilitado, pendiente configurar en Vercel

---

## 📋 Variables de Entorno Requeridas

Para que Sentry funcione en Vercel, necesitas configurar estas variables de entorno:

### 1. Variables Requeridas

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `SENTRY_ORG` | Nombre de tu organización en Sentry | https://sentry.io/settings/ |
| `SENTRY_PROJECT` | Nombre del proyecto en Sentry | https://sentry.io/settings/{org}/projects/ |
| `SENTRY_AUTH_TOKEN` | Token de autenticación | https://sentry.io/settings/account/api/auth-tokens/ |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN público para client-side | https://sentry.io/settings/{org}/projects/{project}/keys/ |

### 2. Variables Opcionales

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `SENTRY_ENVIRONMENT` | Entorno (production/staging) | `production` |
| `SENTRY_RELEASE` | Versión del release | Auto-generado por Vercel |

---

## 🚀 Pasos de Configuración

### Paso 1: Crear Cuenta y Proyecto en Sentry

1. Ve a https://sentry.io/signup/
2. Crea una cuenta gratuita (hasta 5,000 eventos/mes gratis)
3. Crea un nuevo proyecto:
   - **Platform**: Next.js
   - **Project Name**: `resply` (o el que prefieras)
   - **Team**: Tu organización

### Paso 2: Obtener las Variables

#### A. SENTRY_ORG
```
1. Ve a https://sentry.io/settings/
2. En la URL verás: sentry.io/settings/{tu-org}/
3. Copia el nombre de la organización
```

#### B. SENTRY_PROJECT
```
1. Ve a https://sentry.io/settings/{org}/projects/
2. Busca tu proyecto "resply"
3. El nombre del proyecto aparece en la lista
```

#### C. SENTRY_AUTH_TOKEN
```
1. Ve a https://sentry.io/settings/account/api/auth-tokens/
2. Click en "Create New Token"
3. Nombre: "Vercel Deployment"
4. Scopes necesarios:
   ✅ project:read
   ✅ project:releases
   ✅ org:read
5. Copia el token (solo se muestra una vez)
```

#### D. NEXT_PUBLIC_SENTRY_DSN
```
1. Ve a https://sentry.io/settings/{org}/projects/{project}/keys/
2. Busca "Client Keys (DSN)"
3. Copia el DSN público
4. Formato: https://{key}@{org}.ingest.sentry.io/{project}
```

### Paso 3: Configurar en Vercel

#### Opción A: Desde el Dashboard de Vercel

```
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "resply"
3. Ve a Settings → Environment Variables
4. Agrega cada variable:

   Nombre: SENTRY_ORG
   Value: [tu-organizacion]
   Environment: Production, Preview, Development
   ✅ Guardar

   Nombre: SENTRY_PROJECT
   Value: resply
   Environment: Production, Preview, Development
   ✅ Guardar

   Nombre: SENTRY_AUTH_TOKEN
   Value: [tu-token]
   Environment: Production, Preview, Development
   ⚠️ Marcarlo como "Sensitive" (oculto)
   ✅ Guardar

   Nombre: NEXT_PUBLIC_SENTRY_DSN
   Value: https://[key]@[org].ingest.sentry.io/[project]
   Environment: Production, Preview, Development
   ✅ Guardar
```

#### Opción B: Desde CLI de Vercel

```bash
cd /Users/admin/Movies/Proyecto\ SaaS/resply

# Configurar variables (reemplaza con tus valores)
vercel env add SENTRY_ORG
# Cuando pregunte: tu-organizacion
# Environment: Production, Preview, Development

vercel env add SENTRY_PROJECT
# Cuando pregunte: resply
# Environment: Production, Preview, Development

vercel env add SENTRY_AUTH_TOKEN
# Cuando pregunte: [tu-token-secreto]
# Environment: Production, Preview, Development

vercel env add NEXT_PUBLIC_SENTRY_DSN
# Cuando pregunte: https://[key]@[org].ingest.sentry.io/[project]
# Environment: Production, Preview, Development
```

### Paso 4: Re-Deploy

Después de configurar las variables:

```bash
# Forzar un nuevo deployment
git commit --allow-empty -m "chore: Trigger redeploy with Sentry config"
git push origin main
```

O desde Vercel Dashboard:
```
Deployments → ... → Redeploy
```

---

## ✅ Verificación

### 1. Build Exitoso

Después del deploy, verifica:

```
✅ Build logs muestran:
   "Uploading source maps to Sentry..."
   "Successfully uploaded source maps"

❌ Si falla:
   - Verifica que SENTRY_AUTH_TOKEN tiene los scopes correctos
   - Verifica que SENTRY_ORG y SENTRY_PROJECT son correctos
```

### 2. Errores Capturados

Prueba que Sentry está funcionando:

```bash
# Accede a la página de test:
https://resply.vercel.app/api/test-sentry

# Deberías ver en Sentry (en 1-2 minutos):
✅ Un error de prueba aparece en Issues
✅ El stack trace está completo (source maps funcionando)
✅ El contexto muestra datos de usuario/request
```

### 3. Dashboard de Sentry

```
1. Ve a https://sentry.io/organizations/{org}/issues/
2. Deberías ver eventos entrando en tiempo real
3. Performance monitoring activo
4. Releases versionados automáticamente
```

---

## 🔧 Troubleshooting

### Error: "Missing Sentry auth token"

**Causa**: Variable `SENTRY_AUTH_TOKEN` no configurada o inválida

**Solución**:
```bash
# Regenera el token en Sentry
# Configura en Vercel
# Re-deploy
```

### Error: "Project not found"

**Causa**: `SENTRY_ORG` o `SENTRY_PROJECT` incorrectos

**Solución**:
```bash
# Verifica los nombres exactos en:
# https://sentry.io/settings/{org}/projects/
```

### Build funciona pero no se capturan errores

**Causa**: `NEXT_PUBLIC_SENTRY_DSN` no configurado

**Solución**:
```bash
# Esta variable DEBE empezar con NEXT_PUBLIC_
# Configurar y re-deploy
```

---

## 📊 Configuración Actual

### Archivos de Configuración

1. **next.config.ts** ✅
   - Sentry re-habilitado
   - Source maps ocultos
   - Tunnel route: `/monitoring`

2. **sentry.client.config.ts** ✅
   - Error tracking client-side
   - Performance monitoring
   - Replay sessions

3. **sentry.server.config.ts** ✅
   - Error tracking server-side
   - API route monitoring
   - Database query tracking

4. **sentry.edge.config.ts** ✅
   - Edge runtime monitoring
   - Middleware tracking

### Features Habilitadas

- ✅ Error tracking (client + server)
- ✅ Performance monitoring
- ✅ Session replay (client)
- ✅ Source maps upload
- ✅ Release tracking
- ✅ Vercel Cron Monitors
- ✅ Breadcrumbs automáticos
- ✅ User context
- ✅ Request context

---

## 🎯 Próximos Pasos

Después de configurar Sentry:

1. ✅ **Configurar Alerts**
   - Crear alertas para errores críticos
   - Notificaciones en Slack
   - Email alerts para admins

2. ✅ **Performance Budgets**
   - Definir umbrales de performance
   - Alertas automáticas si se exceden

3. ✅ **Custom Dashboards**
   - Dashboard para métricas clave
   - Gráficos de errores por endpoint
   - User experience metrics

---

## 📚 Referencias

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Sentry Webpack Plugin](https://github.com/getsentry/sentry-webpack-plugin)
- [Source Maps Upload](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)

---

**🎉 Una vez configurado, Sentry capturará automáticamente todos los errores en producción!**
