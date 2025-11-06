# Configuración de Seguridad Manual - Supabase Dashboard

**Fecha:** 2025-11-03
**Estado:** Requiere configuración manual en Supabase Dashboard

---

## Problemas de Seguridad que Requieren Dashboard

Los siguientes problemas de seguridad **no pueden arreglarse vía SQL** y requieren configuración manual en el Supabase Dashboard:

### 1. Leaked Password Protection (WARN)

**Descripción:**
Supabase Auth puede prevenir el uso de contraseñas comprometidas verificando contra la base de datos de HaveIBeenPwned.org.

**Requisito:**
- Plan Pro o superior de Supabase (no disponible en Free tier)

**Cómo habilitarlo:**
1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Navega a tu proyecto
3. Ve a **Authentication > Providers**
4. Selecciona **Email** provider
5. En la sección **Password Settings**, habilita:
   - **Prevent the use of leaked passwords** ✅

**Configuraciones recomendadas adicionales:**
```
Minimum password length: 8 characters (mínimo recomendado)
Required characters: Digits, lowercase, uppercase, symbols
Leaked password protection: Enabled ✅
```

**Documentación:**
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 2. Insufficient MFA Options (WARN)

**Descripción:**
Tu proyecto tiene pocas opciones de Multi-Factor Authentication habilitadas.

**Cómo configurarlo:**
1. Ve al Dashboard de Supabase
2. Navega a **Authentication > Providers**
3. Habilita opciones de MFA adicionales:
   - **TOTP (Time-based One-Time Password)** ✅
   - **SMS (opcional, requiere Twilio)**
   - **Authenticator Apps** (Google Authenticator, Authy, etc.)

**Configuración recomendada:**
```
MFA Enforcement Level: Optional (users can enable it)
Allowed MFA factors:
  - TOTP ✅
  - Authenticator apps ✅
```

**Documentación:**
https://supabase.com/docs/guides/auth/auth-mfa

---

## Problemas Arreglados Automáticamente (via SQL Migrations)

### ✅ 1. RLS Disabled on workspace_members (ERROR) - ARREGLADO
- **Solución:** Creadas security definer functions + re-habilitado RLS
- **Migration:** `fix_workspace_members_rls_with_security_definer`
- **Status:** ✅ Completado

### ✅ 2. Function Search Path Mutable (WARN) - ARREGLADO
- **Funciones arregladas:**
  - `update_conversations_updated_at`
  - `update_documents_updated_at`
- **Solución:** Agregado `SET search_path = public, pg_catalog` + `SECURITY DEFINER`
- **Migration:** `fix_trigger_functions_search_path`
- **Status:** ✅ Completado

---

## Próximos Pasos

### 1. Verificar Plan de Supabase
Primero verifica tu plan actual:
```bash
# Ir al dashboard
https://supabase.com/dashboard/project/_/settings/billing
```

Si estás en **Free tier:**
- Leaked password protection NO estará disponible
- MFA básico sí está disponible

Si estás en **Pro tier** ($25/mes):
- Todas las features de seguridad están disponibles ✅

### 2. Aplicar Configuraciones Manualmente
Sigue las instrucciones arriba para:
1. Habilitar Leaked Password Protection (si estás en Pro)
2. Configurar opciones de MFA adicionales

### 3. Verificar con Security Advisors
Después de aplicar los cambios, verifica que los warnings desaparezcan:

```bash
# Ejecutar desde el proyecto
npm run dev

# En otra terminal
curl -X POST http://localhost:3000/api/verify-security
```

O desde Supabase Dashboard:
```
Settings > Database > Advisors
```

---

## Resumen de Estado

| Issue | Severity | Status | Acción Requerida |
|-------|----------|--------|------------------|
| RLS disabled on workspace_members | ERROR | ✅ Arreglado | Ninguna |
| Function search_path mutable (2x) | WARN | ✅ Arreglado | Ninguna |
| Leaked Password Protection disabled | WARN | ⚠️ Manual | Dashboard (requiere Pro plan) |
| Insufficient MFA options | WARN | ⚠️ Manual | Dashboard |

---

## Notas

- **Leaked Password Protection** requiere plan Pro ($25/mes)
- **MFA básico** está disponible en Free tier
- Todos los cambios de SQL migrations ya están aplicados ✅
- No se requiere código adicional para habilitar estas features
