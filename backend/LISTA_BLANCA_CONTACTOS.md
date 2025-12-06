# 📞 Lista Blanca de Contactos Públicos

## 🎯 ¿Qué es esto?

El chatbot tiene un **filtro de seguridad PII** (Personal Identifiable Information) que bloquea información personal como teléfonos, emails y direcciones para proteger la privacidad de los usuarios.

Sin embargo, **la información de contacto de la parroquia es pública** y debe compartirse con los usuarios.

La **Lista Blanca** permite que el chatbot comparta teléfonos, emails y direcciones públicas de la iglesia, mientras sigue bloqueando datos privados de usuarios.

---

## 📋 ¿Cómo funciona?

### ✅ Permitido (en lista blanca)
- Teléfono oficial de la parroquia → `918234567`
- Email de secretaría → `secretaria@parroquia.es`
- Dirección de la iglesia → `Calle Mayor, 123`

### ❌ Bloqueado (NO en lista blanca)
- Teléfono personal de un feligrés → `[TELÉFONO ELIMINADO]`
- Email personal → `[EMAIL ELIMINADO]`
- DNI/NIE → `[DOCUMENTO ELIMINADO]` (siempre bloqueado)
- Dirección privada → `[DIRECCIÓN ELIMINADA]`

---

## 🔧 Configuración

### Paso 1: Editar el archivo

Abre el archivo:
```
backend/app/api/chat/message/route.ts
```

### Paso 2: Localizar la lista blanca

Busca la sección `PUBLIC_CONTACT_WHITELIST` (aproximadamente línea 115):

```typescript
const PUBLIC_CONTACT_WHITELIST = {
  phones: [
    // Agregar aquí los teléfonos públicos
  ],
  emails: [
    // Agregar aquí los emails públicos
  ],
  addresses: [
    // Agregar aquí las direcciones públicas
  ],
};
```

### Paso 3: Agregar tus contactos

#### Teléfonos
Puedes agregar en cualquier formato:
```typescript
phones: [
  '918234567',           // Sin prefijo
  '+34918234567',        // Con prefijo internacional
  '918 23 45 67',        // Con espacios
  '918-23-45-67',        // Con guiones
  '612345678',           // Móviles también
],
```

**El sistema normaliza automáticamente** (quita espacios, guiones, +34), así que no importa el formato.

#### Emails
```typescript
emails: [
  'info@parroquia.es',
  'secretaria@parroquia.es',
  'parroco@parroquia.es',
  'catequesis@parroquia.es',
],
```

**El sistema normaliza a minúsculas**, así que `INFO@parroquia.es` y `info@parroquia.es` se tratan igual.

#### Direcciones
```typescript
addresses: [
  'Calle Mayor, 123',
  'Plaza de la Iglesia, 1',
  'Avenida de la Constitución, 45',
],
```

**El sistema normaliza** (minúsculas, espacios únicos) y busca coincidencias parciales.

---

## 📝 Ejemplo Completo

```typescript
const PUBLIC_CONTACT_WHITELIST = {
  phones: [
    // Teléfono fijo de la parroquia
    '918234567',
    '+34918234567',

    // Teléfono móvil de emergencias
    '612345678',

    // Fax (si aplica)
    '918234568',
  ],

  emails: [
    // Email principal
    'info@sanmiguelarcangel.es',

    // Email de secretaría
    'secretaria@sanmiguelarcangel.es',

    // Email del párroco
    'parroco@sanmiguelarcangel.es',

    // Email de catequesis
    'catequesis@sanmiguelarcangel.es',
  ],

  addresses: [
    // Dirección de la iglesia
    'Calle de la Iglesia, 1',

    // Salón parroquial (si diferente)
    'Plaza del Carmen, 5',
  ],
};
```

---

## 🧪 Cómo Probar

### Antes (sin lista blanca)
**Usuario pregunta:** _"¿Cuál es el teléfono de la parroquia?"_

**Chatbot responde:**
```
El teléfono es [TELÉFONO ELIMINADO]

_Nota: Se ha omitido información personal por seguridad._
```
❌ **Malo** - El usuario no obtiene la información

---

### Después (con lista blanca)
**Usuario pregunta:** _"¿Cuál es el teléfono de la parroquia?"_

**Chatbot responde:**
```
El teléfono de la parroquia es 918234567
```
✅ **Bien** - El usuario obtiene la información pública

---

## 🛡️ Seguridad Mantenida

El filtro **sigue protegiendo** datos privados:

**Ejemplo 1: Usuario comparte su teléfono**
```
Usuario: "Mi teléfono es 611223344"
Chatbot: "Tu teléfono es [TELÉFONO ELIMINADO]"
```
✅ Protege la privacidad del usuario

**Ejemplo 2: Chatbot da teléfono oficial**
```
Usuario: "¿Cuál es el teléfono?"
Chatbot: "El teléfono es 918234567"
```
✅ Comparte información pública de la iglesia

---

## ⚠️ Importante

1. **Solo agrega información PÚBLICA** que ya esté en la web de la parroquia o folletos públicos
2. **NO agregues** teléfonos/emails personales de sacerdotes, voluntarios o feligreses
3. **Revisa periódicamente** si hay cambios en los contactos públicos
4. **Mantén la lista actualizada** si cambian teléfonos/emails

---

## 🚀 Aplicar Cambios

Después de editar la lista blanca:

1. **Guardar el archivo** `route.ts`
2. **Reiniciar el servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```
3. **Probar con preguntas** como:
   - "¿Cuál es el teléfono de la parroquia?"
   - "Dame el email de contacto"
   - "¿Dónde está la iglesia?"

---

## 📊 Logs de Debug

Cuando el filtro detecta información, verás logs como:

```bash
⚠️ [req_123] PII detectado en respuesta del agente: ['teléfono privado']
```

Si ves esto **con teléfonos públicos**, significa que falta agregarlos a la lista blanca.

Si ves:
```bash
✅ [req_123] Respuesta sin PII detectado
```
Significa que los contactos públicos pasaron correctamente.

---

## 🆘 Problemas Comunes

### Problema: El chatbot sigue bloqueando el teléfono público

**Solución:**
1. Verifica que agregaste el teléfono **exactamente como lo dice el agente**
2. Prueba agregarlo en **múltiples formatos**:
   ```typescript
   phones: [
     '918234567',
     '+34918234567',
     '918 23 45 67',
   ]
   ```
3. Revisa los logs para ver qué formato está detectando

### Problema: El filtro no bloquea un email privado

**Solución:**
- Esto es NORMAL si el email coincide parcialmente con uno de la lista blanca
- Revisa que los emails en la lista sean específicos

---

## 📞 Contacto Técnico

Si tienes problemas configurando la lista blanca:
- Revisa los logs del servidor backend
- Verifica que el archivo se guardó correctamente
- Reinicia el servidor después de los cambios

---

**Última actualización:** 17 de Octubre 2025
