# 📁 Recursos Descargables

Esta carpeta contiene PDFs y documentos que el chatbot puede ofrecer automáticamente a los usuarios.

## Cómo funciona

1. **Coloca tus PDFs aquí** (en `/public/docs/`)
2. **Actualiza** `backend/app/api/chat/tools/resourcesTool.ts` → `RESOURCES_DATABASE` con la metadata
3. **El agente detecta automáticamente** cuándo ofrecer el recurso según keywords

## Ejemplo de estructura

```
/public/docs/
  ├── catequesis-infantil-inscripcion.pdf
  ├── autorizacion-salida-parroquial.pdf
  └── README.md
```

## URLs accesibles

Los archivos en esta carpeta son públicamente accesibles en:
```
https://tu-dominio.vercel.app/docs/nombre-archivo.pdf
```

## Cómo añadir un nuevo recurso

1. Sube el PDF aquí
2. Edita `backend/app/api/chat/tools/resourcesTool.ts` y añade una entrada en `RESOURCES_DATABASE`:

```typescript
"mi_nuevo_recurso": {
  "title": "Título descriptivo",
  "description": "Descripción breve",
  "url": "/docs/tu-archivo.pdf",
  "type": "pdf",
  "keywords": ["palabra1", "palabra2", "relacionadas"]
}
```

3. Haz commit y push para desplegar
4. El chatbot automáticamente lo ofrecerá cuando detecte las keywords en la conversación

## URLs externas

También puedes referenciar URLs externas (Typeform, Google Forms, etc.):

```typescript
"formulario_externo": {
  "title": "Formulario de Inscripción",
  "description": "Formulario online",
  "url": "https://form.typeform.com/to/ejemplo",
  "type": "url",
  "keywords": ["inscripcion", "formulario"]
}
```

## Nota Técnica

Los recursos están embebidos en el código (no en archivo JSON separado) para compatibilidad con Vercel Edge Runtime.
