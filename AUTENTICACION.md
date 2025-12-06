# 🔐 Sistema de Autenticación

Este documento explica cómo configurar y usar el sistema de autenticación completo con **Supabase** y **Resend**.

## 📋 Estructura

### Backend (Vercel Edge Functions)

#### Archivos creados:
- `backend/app/lib/supabase.ts` - Cliente de Supabase (service role)
- `backend/app/lib/resend.ts` - Cliente de Resend
- `backend/app/lib/email-templates.ts` - Plantillas de emails

#### Endpoints API:
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `POST /api/auth/verify-token` - Verificar token de sesión

### Frontend (React Native + Expo)

#### Archivos:
- `lib/supabase.ts` - Cliente de Supabase (anon key)
- `contexts/AuthContext.tsx` - Context con funciones de autenticación

## ⚙️ Configuración

### 1. Variables de Entorno del Backend

Edita `backend/.env` y agrega:

```env
# Supabase (para autenticación)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Resend (para emails de autenticación)
RESEND_API_KEY=re_tu_clave_resend_aqui
RESEND_FROM_EMAIL=Parroquia <noreply@tudominio.com>
```

**Dónde obtener las claves:**

1. **Supabase**:
   - Ve a tu proyecto en https://app.supabase.com
   - Settings → API
   - Copia `URL`, `anon public` y `service_role` (⚠️ NUNCA compartas el service_role)

2. **Resend**:
   - Ve a https://resend.com/api-keys
   - Crea una nueva API Key
   - Configura tu dominio en https://resend.com/domains

### 2. Variables de Entorno del Frontend

Edita `.env` y agrega:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=eyJhbGciOi...
```

### 3. Configurar Authentication en Supabase

1. Ve a **Authentication → Providers** en Supabase
2. Habilita **Email** provider
3. **Desactiva** "Confirm email" (usaremos Resend para esto)
4. En **Email Templates**, configura las URLs de redirect:
   - Confirmation URL: `myapp://auth/confirm`
   - Password Reset URL: `myapp://auth/reset-password`

### 4. Estructura de Base de Datos

La tabla `public.profiles` ya está creada con:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Uso en la Aplicación

### Ejemplo de Login

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      // Usuario autenticado ✅
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
}
```

### Ejemplo de Registro

```tsx
import { useAuth } from '@/contexts/AuthContext';

function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    try {
      await signUp(email, password, fullName, phone);
      Alert.alert(
        'Registro exitoso',
        'Revisa tu email para confirmar tu cuenta'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Nombre" value={fullName} onChangeText={setFullName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Teléfono" value={phone} onChangeText={setPhone} />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Registrarse" onPress={handleRegister} />
    </View>
  );
}
```

### Ejemplo de Recuperación de Contraseña

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    try {
      await resetPassword(email);
      Alert.alert(
        'Email enviado',
        'Revisa tu correo para restablecer tu contraseña'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <Button title="Enviar Email" onPress={handleResetPassword} />
    </View>
  );
}
```

### Proteger Pantallas (Autenticación Requerida)

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

function ProtectedScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View>
      <Text>Contenido protegido</Text>
    </View>
  );
}
```

### Obtener Perfil del Usuario

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ProfileScreen() {
  const { profile, updateProfile } = useAuth();

  const handleUpdateName = async (newName: string) => {
    try {
      await updateProfile({ full_name: newName });
      Alert.alert('Perfil actualizado');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>Nombre: {profile?.full_name}</Text>
      <Text>Email: {profile?.email}</Text>
      <Text>Rol: {profile?.role}</Text>
    </View>
  );
}
```

## 📧 Plantillas de Email (Resend)

### Email de Confirmación
Se envía automáticamente al registrarse. Incluye:
- Mensaje de bienvenida
- Botón para confirmar cuenta
- Enlace válido por 24 horas

### Email de Recuperación de Contraseña
Se envía al solicitar recuperación. Incluye:
- Instrucciones claras
- Botón para restablecer contraseña
- Enlace válido por 1 hora

### Email de Bienvenida
Se puede enviar después de confirmar la cuenta (opcional).

## 🔒 Seguridad

### Backend
- ✅ Usa `service_role_key` para operaciones administrativas
- ✅ Valida todos los inputs
- ✅ No revela si un email existe (en forgot-password)
- ✅ Maneja errores sin exponer información sensible

### Frontend
- ✅ Usa `anon_key` (segura para el cliente)
- ✅ Guarda sesiones en AsyncStorage (persistencia)
- ✅ Auto-refresh de tokens
- ✅ Limpia sesiones al cerrar sesión

## 🧪 Testing

### 1. Probar Registro
```bash
curl -X POST https://tu-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Usuario Test",
    "phone": "+34123456789"
  }'
```

### 2. Probar Login
```bash
curl -X POST https://tu-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Probar Recuperación
```bash
curl -X POST https://tu-backend.vercel.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## 📝 Notas Importantes

1. **Confirmación de Email**: Por defecto, Supabase requiere confirmación. Hemos configurado Resend para enviar estos emails con plantillas personalizadas.

2. **Roles**: Por defecto, todos los usuarios se crean con rol `member`. Puedes cambiarlo manualmente en Supabase o crear un endpoint para promover usuarios.

3. **Actualización de Perfil**: El perfil se sincroniza automáticamente con `auth.users` y `public.profiles`.

4. **Sesiones**: Las sesiones se refrescan automáticamente y persisten en AsyncStorage.

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que `.env` tenga `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON`

### Error: "Email not confirmed"
- El usuario debe confirmar su email antes de hacer login
- Revisa que Resend esté configurado correctamente

### Emails no se envían
- Verifica `RESEND_API_KEY` en `backend/.env`
- Confirma que tu dominio esté verificado en Resend
- Revisa logs en https://resend.com/logs

### Error: "Token inválido o expirado"
- Los tokens de confirmación expiran en 24 horas
- Los tokens de recuperación expiran en 1 hora
- Solicita un nuevo email

## ✅ Próximos Pasos

Ahora puedes:

1. Crear las pantallas de UI (`app/login.tsx`, `app/register.tsx`, `app/forgot-password.tsx`)
2. Agregar autenticación con Google/Apple (OAuth)
3. Implementar 2FA (Two-Factor Authentication)
4. Agregar política de roles y permisos
5. Crear dashboard de administración

---

💡 **Tip**: Todas las funciones de autenticación están en `useAuth()`. Úsalo en cualquier componente para acceder a `session`, `profile`, `signIn`, `signUp`, `signOut`, etc.
