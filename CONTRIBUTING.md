# Guía de Contribución

¡Gracias por tu interés en contribuir al Chatbot Parroquial! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Empezar](#cómo-empezar)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## 🤝 Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente inclusivo y respetuoso. Al participar, te comprometes a mantener estos estándares:

- Ser respetuoso y profesional
- Aceptar críticas constructivas
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

## 🚀 Cómo Empezar

### Prerequisitos

- Node.js 20+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm 10+
- Git
- Cuenta de GitHub

### Setup Local

1. **Fork el repositorio** en GitHub

2. **Clona tu fork**:
   ```bash
   git clone https://github.com/TU_USUARIO/APP-PARRO.git
   cd "APP PARRO"
   ```

3. **Agrega el repositorio original como upstream**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/APP-PARRO.git
   ```

4. **Instala dependencias**:
   ```bash
   # Frontend (raíz del proyecto)
   npm install

   # Backend
   cd backend
   npm install
   cd ..
   ```

5. **Configura variables de entorno**:
   ```bash
   # Frontend
   cp .env.example .env
   # Edita .env con tus valores

   # Backend
   cp backend/.env.example backend/.env
   # Edita backend/.env con tus valores
   ```

6. **Verifica que todo funcione**:
   ```bash
   # Tests
   npm test

   # Linter
   npm run lint

   # App en desarrollo
   npm start
   ```

## 🔧 Proceso de Desarrollo

### 1. Sincroniza con upstream

Antes de empezar a trabajar, asegúrate de tener la última versión:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Crea una branch

Usa nombres descriptivos para tus branches:

```bash
# Feature
git checkout -b feat/nombre-descriptivo

# Bug fix
git checkout -b fix/descripcion-del-bug

# Documentación
git checkout -b docs/que-documentas

# Refactoring
git checkout -b refactor/que-refactorizas
```

**Ejemplos**:
- `feat/add-image-attachments`
- `fix/chat-scroll-bug`
- `docs/update-api-reference`
- `refactor/simplify-cache-logic`

### 3. Desarrolla tu feature

- Escribe código limpio y legible
- Sigue los estándares de código (ver abajo)
- Agrega tests para nueva funcionalidad
- Actualiza documentación si es necesario

### 4. Commit frecuentemente

Haz commits pequeños y atómicos:

```bash
git add .
git commit -m "feat(chat): add image attachment support"
```

### 5. Push a tu fork

```bash
git push origin feat/nombre-descriptivo
```

### 6. Crea Pull Request

Ve a GitHub y crea un PR desde tu branch hacia `main` del repositorio original.

## 📝 Estándares de Código

### TypeScript

**Principios generales**:
- Usa `const` por defecto, `let` solo si es necesario, nunca `var`
- Tipos explícitos en funciones públicas y exportadas
- Evita `any`, usa tipos específicos o `unknown`
- Nombres descriptivos (no abreviaturas crípticas)

**Ejemplos**:

```typescript
// ✅ Correcto
const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const user = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return user.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// ❌ Incorrecto
const getUsr = async (id: any) => {
  var u = await supabase.from('users').select('*').eq('id', id).single();
  return u.data;
};
```

### React / React Native

**Componentes**:
- Usa functional components con hooks
- Exporta componentes como named exports
- Props con interfaces TypeScript
- Destructura props en los parámetros

```typescript
// ✅ Correcto
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  onPress?: () => void;
}

export const MessageBubble = ({ message, isUser, onPress }: MessageBubbleProps) => {
  return (
    <Pressable onPress={onPress}>
      <Text>{message.content}</Text>
    </Pressable>
  );
};

// ❌ Incorrecto
export default function MessageBubble(props) {
  return <Text>{props.message.content}</Text>;
}
```

**Hooks personalizados**:
- Prefijo `use` siempre
- Retornar objeto con valores nombrados (no array)
- Documentar con JSDoc

```typescript
/**
 * Hook para gestionar el estado del chat
 * @returns Estado y funciones del chat
 */
export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // ...
  };

  return { messages, isLoading, sendMessage };
};
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `MessageBubble` |
| Hooks | camelCase con `use` | `useChat` |
| Funciones | camelCase | `sendMessage` |
| Variables | camelCase | `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase con `I` opcional | `MessageProps` o `IMessage` |
| Types | PascalCase | `UserRole` |
| Archivos | kebab-case | `message-bubble.tsx` |
| Carpetas | kebab-case | `chat-components` |

### Formateo

Este proyecto usa **Prettier** para formateo automático:

```bash
# Formatear todo el proyecto
npm run format

# Verificar formateo
npm run format:check
```

**Configuración Prettier** (`.prettierrc`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### ESLint

Correr linter antes de commitear:

```bash
npm run lint

# Auto-fix
npm run lint:fix
```

## 💬 Commits

### Conventional Commits

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit estructurados.

**Formato**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formateo (no afecta código)
- `refactor`: Refactoring de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento (deps, config)
- `perf`: Mejoras de performance
- `ci`: Cambios en CI/CD
- `build`: Cambios en build system
- `revert`: Revertir commit anterior

**Scopes** (opcional pero recomendado):
- `chat`: Componentes/lógica de chat
- `auth`: Autenticación
- `api`: Backend APIs
- `ui`: Componentes de UI
- `hooks`: Custom hooks
- `tools`: AI tools (pineconeTool, etc.)
- `pwa`: Progressive Web App
- `deps`: Dependencias

**Ejemplos**:

```bash
# Feature nueva
git commit -m "feat(chat): add image attachment support"

# Bug fix
git commit -m "fix(chat): resolve scroll to bottom issue on new message"

# Documentación
git commit -m "docs(api): update OpenAPI spec for message-stream endpoint"

# Refactoring
git commit -m "refactor(tools): simplify pineconeTool query expansion logic"

# Multiple líneas
git commit -m "feat(pwa): add install banner component

- Create InstallPWA component
- Add detection for install prompt
- Integrate in tab layout

Closes #45"

# Breaking change
git commit -m "feat(api): change message format to include metadata

BREAKING CHANGE: Messages now require 'metadata' field in request body.
Update your client to include empty object if no metadata needed."
```

### Reglas de Commits

- **Presente imperativo**: "add feature" no "added feature"
- **Primera letra minúscula**: "add" no "Add"
- **Sin punto al final**: "add feature" no "add feature."
- **Máximo 72 caracteres** en la primera línea
- **Body opcional** para explicar el "por qué"
- **Footer** para referencias (issues, breaking changes)

## 🔀 Pull Requests

### Antes de crear el PR

Checklist:

- [ ] Tu branch está actualizada con `main`
- [ ] Todos los tests pasan: `npm test`
- [ ] Linter pasa: `npm run lint`
- [ ] Agregaste tests para nueva funcionalidad
- [ ] Actualizaste documentación si es necesario
- [ ] Commits siguen Conventional Commits

### Crear el PR

1. **Título descriptivo** siguiendo Conventional Commits:
   ```
   feat(chat): Add image attachment support
   ```

2. **Descripción completa** usando el template:

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva feature (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causa cambios incompatibles)
- [ ] Documentación

## Motivación y Contexto
¿Por qué es necesario este cambio? ¿Qué problema resuelve?

Closes #123

## ¿Cómo se ha testeado?
Describe las pruebas que realizaste.

- [ ] Test A
- [ ] Test B

## Screenshots (si aplica)
Agrega screenshots o GIFs si hay cambios visuales.

## Checklist
- [ ] Mi código sigue el estilo de este proyecto
- [ ] Realicé self-review de mi código
- [ ] Comenté mi código en partes complejas
- [ ] Actualicé la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] Agregué tests que prueban mi fix/feature
- [ ] Tests unitarios nuevos y existentes pasan localmente
```

### Proceso de Review

1. **Auto-asignación**: Asígnate el PR a ti mismo
2. **Labels**: Agrega labels apropiados (`bug`, `enhancement`, `documentation`)
3. **Reviewers**: Solicita review de al menos 1 persona
4. **CI/CD**: Espera a que pasen las GitHub Actions
5. **Cambios solicitados**: Aplica feedback y haz push
6. **Aprobación**: Espera aprobación antes de merge
7. **Merge**: Usa "Squash and merge" para mantener historial limpio

### Revisando PRs de otros

Cuando revises PRs:

- ✅ **Sé constructivo**: "Considera usar X porque..." en lugar de "Esto está mal"
- ✅ **Explica el por qué**: Da contexto a tus sugerencias
- ✅ **Distingue**: "Debe cambiarse" vs "Sugerencia opcional"
- ✅ **Elogia**: Reconoce el buen código
- ❌ **No personalices**: Critica el código, no la persona

## 🧪 Testing

### Tests Requeridos

**Para nueva funcionalidad**:
- Tests unitarios para funciones/hooks
- Tests de componentes para UI
- Tests de integración si afecta múltiples sistemas

**Para bug fixes**:
- Test que reproduzca el bug
- Test que verifique que el fix funciona

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en watch mode
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Backend tests
cd backend && npm test
```

### Escribir Tests

**Frontend (Jest + Testing Library)**:

```typescript
// hooks/__tests__/useChat.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useChat } from '../useChat';

describe('useChat', () => {
  it('should add message to history when sendMessage is called', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello');
  });
});
```

**Backend (Jest)**:

```typescript
// backend/app/api/__tests__/message.test.ts
import { POST } from '../chat/message/route';
import { NextRequest } from 'next/server';

describe('POST /api/chat/message', () => {
  it('should return response for valid message', async () => {
    const request = new NextRequest('http://localhost/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
  });
});
```

### Cobertura de Código

Mantenemos un mínimo de **60% de cobertura**:

```bash
npm run test:coverage

# Ver reporte
open coverage/lcov-report/index.html
```

## 📚 Documentación

### Documentar Código

**JSDoc para funciones públicas**:

```typescript
/**
 * Busca información en documentos parroquiales usando Pinecone
 * @param query - Consulta del usuario
 * @param categoria - Categoría pastoral opcional para filtrar
 * @returns Texto con información relevante encontrada
 * @throws {Error} Si hay error de conexión con Pinecone
 */
export async function searchPinecone(
  query: string,
  categoria?: string | null
): Promise<string> {
  // ...
}
```

### Actualizar Documentación

Si tus cambios afectan:

- **Setup**: Actualiza `README.md` o `SETUP.md`
- **APIs**: Actualiza `QUICK_REFERENCE.md` y OpenAPI spec
- **Arquitectura**: Actualiza `REPORTE_SERVICES_APIS_COMPLETO.md`
- **Features**: Actualiza `CHANGELOG.md`

### Crear Nueva Documentación

Si creas docs nuevas:

- Usa Markdown
- Agrega tabla de contenidos
- Incluye ejemplos de código
- Agrega diagramas si ayuda (Mermaid)
- Referencia desde README.md

## 🐛 Reportar Bugs

### Antes de reportar

1. Busca si el bug ya fue reportado en [Issues](https://github.com/USER/REPO/issues)
2. Verifica que sea reproducible en la última versión
3. Verifica que sea un bug, no una feature request

### Template de Bug Report

```markdown
**Descripción del bug**
Descripción clara y concisa del bug.

**Para Reproducir**
Pasos para reproducir el comportamiento:
1. Ve a '...'
2. Haz click en '...'
3. Scroll hacia '...'
4. Ver error

**Comportamiento Esperado**
Qué esperabas que pasara.

**Screenshots**
Si aplica, agrega screenshots.

**Environment**
- OS: [e.g. iOS 17, Android 14, macOS]
- App version: [e.g. 1.0.0]
- Node version: [e.g. 20.0.0]

**Logs**
```
Pega logs relevantes aquí
```

**Contexto Adicional**
Cualquier otro contexto sobre el problema.
```

## 💡 Proponer Features

### Template de Feature Request

```markdown
**¿Tu feature request está relacionada a un problema?**
Descripción clara del problema. Ej: "Es frustrante cuando [...]"

**Solución Propuesta**
Descripción clara de lo que quieres que pase.

**Alternativas Consideradas**
Otras soluciones o features que consideraste.

**Contexto Adicional**
Screenshots, mockups, ejemplos de otras apps, etc.
```

## ❓ Preguntas

Si tienes preguntas:

1. Revisa la [documentación](./README.md)
2. Busca en [Issues cerrados](https://github.com/USER/REPO/issues?q=is%3Aissue+is%3Aclosed)
3. Abre un issue con label `question`

## 📞 Contacto

- Crear issue en GitHub
- Email: [email@example.com]

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la misma licencia del proyecto.

---

¡Gracias por contribuir al Chatbot Parroquial! 🙏
