# Backend de Parroquias

Backend para la aplicación de Parroquias que proporciona endpoints para el chat con IA usando OpenAI ChatKit y Agent Builder.

## 🚀 Despliegue en Vercel

### 1. Instalar Vercel CLI (opcional, para deployment desde terminal)

```bash
npm install -g vercel
```

### 2. Opción A: Desplegar desde GitHub (Recomendado)

1. Sube el código a un repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Click en "Add New Project"
4. Importa tu repositorio de GitHub
5. Configura las variables de entorno (ver abajo)
6. Click en "Deploy"

### 3. Opción B: Desplegar desde terminal

```bash
cd backend
vercel
```

Sigue las instrucciones en la terminal y configura las variables de entorno cuando se te pida.

## ⚙️ Variables de Entorno

En Vercel, ve a:
**Project Settings > Environment Variables**

Añade estas variables:

| Variable | Valor | Dónde conseguirla |
|----------|-------|-------------------|
| `OPENAI_API_KEY` | `sk-proj-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `CHATKIT_WORKFLOW_ID` | `wf_...` | Agent Builder > Click "Publish" > Copia el ID |

⚠️ **Importante**: La API key debe ser del mismo organization y project que tu Agent Builder.

## 🔧 Desarrollo Local

1. Instala las dependencias:
```bash
npm install
```

2. Crea un archivo `.env` con tus variables:
```bash
cp .env.example .env
# Edita .env con tus valores reales
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El servidor estará en `http://localhost:3000`

## 📡 Endpoints

### POST /api/chatkit/session

Crea una nueva sesión de ChatKit.

**Response:**
```json
{
  "client_secret": "cs_..."
}
```

## 🔗 Conectar con la App

Una vez desplegado en Vercel, recibirás una URL como:
```
https://tu-proyecto.vercel.app
```

Actualiza la variable `EXPO_PUBLIC_API_BASE` en el `.env` de tu app móvil:

```env
EXPO_PUBLIC_API_BASE=https://tu-proyecto.vercel.app
```

## 📝 Notas

- El endpoint tiene CORS habilitado para todas las origins
- En producción, considera restringir CORS solo a tu dominio
- Las sesiones de ChatKit expiran después de un tiempo
- Vercel tiene un plan gratuito que funciona perfectamente para este uso

## 🐛 Troubleshooting

### Error: "CHATKIT_WORKFLOW_ID no está configurado"
- Verifica que añadiste las variables de entorno en Vercel
- Re-despliega después de añadir las variables

### Error: "Unauthorized"
- Verifica que tu OPENAI_API_KEY sea válida
- Verifica que la API key sea del mismo org/project que tu workflow

### Error: "Workflow not found"
- Verifica que tu workflow esté publicado (no solo guardado)
- Verifica que el CHATKIT_WORKFLOW_ID sea correcto (empieza con `wf_`)
