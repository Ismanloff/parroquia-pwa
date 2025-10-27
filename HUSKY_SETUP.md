# Husky Git Hooks Setup

El proyecto está configurado con Husky para ejecutar validaciones automáticas antes de commits y push.

## Configuración Inicial (Solo si usas Git)

### 1. Inicializar repositorio Git (si no lo has hecho)

```bash
git init
```

### 2. Inicializar Husky

```bash
npx husky init
```

### 3. Crear hooks

#### Pre-commit (valida código antes de commit)

```bash
echo "npm run lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

#### Pre-push (valida tipos y tests antes de push)

```bash
echo "npm run type-check && npm run test" > .husky/pre-push
chmod +x .husky/pre-push
```

## Comandos Disponibles

### Linting y Formateo

```bash
# Verificar errores de ESLint
npm run lint

# Corregir errores de ESLint automáticamente
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin modificar
npm run format:check
```

### Type Checking

```bash
# Verificar tipos TypeScript
npm run type-check
```

### Testing

```bash
# Ejecutar tests
npm run test

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con coverage
npm run test:coverage
```

### Análisis de Bundle

```bash
# Analizar tamaño del bundle
npm run analyze
```

## ¿Qué hace cada hook?

### Pre-commit

- Ejecuta ESLint y Prettier solo en archivos modificados
- Corrige errores automáticamente si es posible
- Previene commits con errores de lint

### Pre-push

- Verifica que no hay errores de TypeScript
- Ejecuta todos los tests
- Previene push de código roto

## Saltarse los hooks (SOLO EN EMERGENCIAS)

```bash
# Saltarse pre-commit
git commit --no-verify -m "mensaje"

# Saltarse pre-push
git push --no-verify
```

⚠️ **NO recomendado**: Solo usar en casos de emergencia absoluta.
