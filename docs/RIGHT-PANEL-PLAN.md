# RIGHT PANEL IMPLEMENTATION PLAN

## 0) Contexto
Objetivo: entregar un panel lateral de Gemini estable, usable por equipo y luego con IA/GEM/Google backup.

## 1) Fase 1 (hoy: Core + fixes)
1. Asegurar base de UI:
   - `RightPanel` inyectado con z-index correcto.
   - resizable + almacenamiento de width.
   - tab open/close con offset / no bloquear scroll.
2. Arreglar bugs críticos:
   - quitar botón “+ new chat” en carpeta.
   - asegurar 2 columnas mínimo en carpeta list.
   - quitar botón compact mode si ya es comportamiento.
3. Estado del panel:
   - guardar en localStorage: visible/closed, ancho, compact/expanded, split.
   - cargar on init.
4. Carpeta/chat básico:
   - `FolderManager` add/remove/move/getUnassigned.
   - render de carpetas y chats.
   - “unassigned” chats visibles.
5. Bulk:
   - seleccionar múltiples chats.
   - mover a carpeta.
   - agregar/quitar tags.
   - no borrar chats reales en batch.

## 2) Fase 2 (MVP equipo)
1. Edición chat:
   - dropdown por chat -> rename, tags add/remove, remove folder.
   - guardar en datos y persistir.
   - nombre + tags en formato: `title #tag1 #tag2`.
   - rename se refleja en Gemini (via GeminiAdapter).
2. Import/Export:
   - botón “config” abre settings panel.
   - export JSON completo: folders/chats/panelState.
   - import JSON con validación de schema.
   - opción merge/override (modo seguro).
3. Listado inteligente:
   - cargar primero chats recientes.
   - fetch incremental de chats viejos.
   - fondo async para no bloquear.
4. UX de workflow:
   - home clear search.
   - guardado de estado de tablero cuando cambia de folder.
   - disposición de carpetas y orden manual (drag + persist).

## 3) Fase 3 (sync & trabajo en red)
1. Google Auth:
   - flujo OAuth + token control.
   - `storage.sync` + cloud backup.
   - merge local/cloud (no pérdida).
   - export/import from cloud.
2. Gemini/Auth:
   - link de sesión.
   - persist token + reautenticación.
3. Auto-sync:
   - guardado periódico.
   - evento onResume.
   - conflict resolution.

## 4) Fase 4 (GEM / automatización avanzada)
1. folder -> GEM assignment:
   - metadata `folder.gemId`.
   - nuevo chat desde folder usa preset de GEM.
2. template por carpeta:
   - prompt template, sistema de categoría.
3. Smart organizer:
   - rules keyword.
   - suggest folder in batch.
   - NLP simple (title+tags).
   - sugerir y aplicar.
4. UX final:
   - botón “reorganizar por tema”.
   - confidencia + revisión humana.

## 5) Releases y validación
- Crear issues pequeños por cada subtask (A/B/C/D/E/F/G).
- PRs incremental con tests.
- QA checklist:
  - panel responsive.
  - no perder chats.
  - import/export round-trip.
  - rename sync.
  - auth-merge no data-loss.
- Documentar en `CHANGELOG-RIGHT-PANEL.md`.
