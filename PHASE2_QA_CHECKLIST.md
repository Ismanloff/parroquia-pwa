# ✅ Checklist de QA - Fase 2: Multi-Tenancy

## Autenticación y Workspaces
- [ ] Usuario puede crear nuevo workspace
- [ ] Usuario puede ver solo sus workspaces
- [ ] Usuario puede cambiar entre workspaces
- [ ] Workspace activo se persiste en localStorage
- [ ] Selector de workspace muestra todos los workspaces del usuario

## Permisos y Roles
- [ ] Owner puede invitar admins y members
- [ ] Admin puede invitar members
- [ ] Member NO puede invitar usuarios
- [ ] Owner puede eliminar workspace
- [ ] Admin NO puede eliminar workspace

## Aislamiento de Datos
- [ ] Conversaciones solo visibles en su workspace
- [ ] Documentos solo visibles en su workspace
- [ ] Mensajes solo visibles en su workspace
- [ ] Pinecone usa namespace correcto (ws_{workspace_id})

## Invitaciones
- [ ] Usuario puede invitar por email
- [ ] Email de invitación se envía correctamente
- [ ] Usuario invitado recibe email
- [ ] Usuario puede aceptar invitación
- [ ] Usuario aparece en lista de miembros

## Edge Cases
- [ ] ¿Qué pasa si usuario no tiene workspaces? → Redirige a /workspaces/new
- [ ] ¿Qué pasa si workspace_id es inválido? → Error 404
- [ ] ¿Qué pasa si usuario pierde permisos? → Redirige a /workspaces
- [ ] ¿Qué pasa al eliminar workspace? → Vectores en Pinecone se eliminan
