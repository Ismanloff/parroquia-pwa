# 🔧 Configuración de Supabase Transaction Mode

**Objetivo**: Optimizar el uso de conexiones para funciones serverless usando el modo de transacción de Supavisor.

---

## ¿Por qué Transaction Mode?

### Problema con Session Mode (actual)
- Una conexión permanece asignada a un cliente durante toda la sesión
- Las funciones serverless pueden "agarrar" conexiones y no liberarlas rápidamente
- Resultado: Pool de conexiones se agota rápidamente

### Ventaja de Transaction Mode
- La conexión se libera **inmediatamente** después de cada query
- Ideal para serverless donde cada request es independiente
- **Hasta 2-3x más throughput** con el mismo pool de conexiones

---

## 📊 Comparación de Modos

| Característica | Session Mode | Transaction Mode |
|---------------|--------------|------------------|
| **Puerto** | 5432 | 6543 |
| **Duración conexión** | Toda la sesión | Solo durante query |
| **Mejor para** | Apps tradicionales | Serverless functions |
| **Throughput** | Menor | Mayor (2-3x) |
| **Limitaciones** | Pocas | No soporta prepared statements |

---

## 🚀 Cómo Configurar

### Opción 1: Cambiar Connection String (Recomendado)

#### Actual (Session Mode - Puerto 5432):
```typescript
// .env o Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
// Conexión directa usa puerto 5432 por defecto
```

#### Nuevo (Transaction Mode - Puerto 6543):
```typescript
// Para APIs serverless, usa Supavisor transaction pooler
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Opción 2: Configurar en Supabase Dashboard

1. Ve a tu proyecto en https://app.supabase.com
2. Settings → Database
3. Busca "Connection Pooling"
4. Cambia de "Session" a "Transaction"
5. Copia el nuevo connection string (puerto 6543)

---

## 🔧 Implementación en el Código

### Para APIs Next.js (Ya implementado)

El cliente de Supabase ya está configurado para usar HTTP, que automáticamente usa el pooler de Supabase. No necesitas cambios en el código.

### Para Conexiones Directas de PostgreSQL

Si usas librerías como `pg` o Prisma:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  // Usa el puerto 6543 para transaction mode
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://postgres.[PROJECT]:pwd@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

---

## ⚠️ Limitaciones de Transaction Mode

### NO Soportado:
1. **Prepared Statements**: `PREPARE` no funciona
2. **Transacciones multi-query con state**: Variables de sesión se pierden
3. **Temporary Tables**: Se eliminan al final de cada transacción

### Funciona Perfectamente Para:
✅ REST API endpoints (Next.js API Routes)
✅ Queries individuales
✅ Transacciones simples (BEGIN/COMMIT en un solo query)
✅ Serverless functions

---

## 🧪 Probar la Configuración

### 1. Verificar el Puerto Usado

```bash
# En tu terminal
psql $DATABASE_URL -c "SHOW port;"
```

- **5432** = Session mode
- **6543** = Transaction mode ✅

### 2. Probar Performance

```bash
# Antes (Session mode)
curl http://localhost:3000/api/health
# Tiempo: ~200ms bajo carga

# Después (Transaction mode)
curl http://localhost:3000/api/health
# Tiempo esperado: ~100ms bajo carga (2x mejora)
```

### 3. Monitorear Conexiones

```sql
-- Ver conexiones activas
SELECT
  count(*) as connections,
  state
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;
```

**Transaction mode** debería mostrar menos conexiones "idle" y más conexiones liberándose rápido.

---

## 📈 Impacto Esperado

### Antes (Session Mode + 10 conexiones):
- **Capacidad**: 60 req/s antes de timeouts
- **Pool exhaustion**: A 60+ req/s

### Después (Transaction Mode + 30 conexiones):
- **Capacidad esperada**: 150-200 req/s
- **Pool exhaustion**: A 150+ req/s
- **Mejora**: ~2.5-3x

---

## 🔍 Troubleshooting

### Error: "prepared statement does not exist"
**Causa**: Estás usando prepared statements en transaction mode
**Solución**: Deshabilita prepared statements en tu cliente:

```typescript
// Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add this:
  directUrl = env("DIRECT_URL") // Usa puerto 5432 para migraciones
}

// En .env
DATABASE_URL="...pooler.supabase.com:6543..."  // Transaction mode para queries
DIRECT_URL="...supabase.co:5432..."            // Session mode para migraciones
```

### Error: "too many connections"
**Causa**: Ambos poolers (Session + Transaction) están activos
**Solución**: Asegúrate de usar solo uno:
- APIs/Serverless → Puerto 6543 (Transaction)
- Migraciones/Admin → Puerto 5432 (Session) solo cuando sea necesario

---

## ✅ Checklist de Configuración

- [ ] Obtener connection string con puerto 6543 desde Supabase dashboard
- [ ] Actualizar `DATABASE_URL` en `.env` local
- [ ] Actualizar variables de entorno en Vercel
- [ ] Probar conexión: `psql $DATABASE_URL -c "SELECT 1;"`
- [ ] Verificar puerto: `psql $DATABASE_URL -c "SHOW port;"`
- [ ] Ejecutar stress test y comparar resultados

---

## 📚 Referencias

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connection-management)
- [Supavisor Documentation](https://github.com/supabase/supavisor)
- [Transaction Pooling vs Session Pooling](https://www.pgbouncer.org/usage.html)

---

**Siguiente paso**: Una vez configurado transaction mode, ejecuta el stress test de nuevo y documenta las mejoras en throughput.

**Contacto**: Si tienes problemas con la configuración, revisa los logs de Supabase en el dashboard → Logs → Pooler.
