# RIGHT PANEL ROADMAP

## 1) Estado actual (“ya anda”)

- Panel derecho inyectado y visible con `z-index` correcto.
- Resizable con persistencia en storage.
- Botón show/hide + tab lateral.
- Carpeta + chat list funcional.
- “Home limpia búsqueda”.
- Bulk action básico presente.
- Modal/edición de charla parcial.
- `Component.setSafeHTML` reforzado.
- No se recarga la página al crear chat; SPA behavior.
- Init ordenado: panel + sidebar antes de carpeta.

## 2) MVP usable por el equipo (prioridad 1)

### 2.1 Estado y UX panel
- Guardar state del panel:
  - visible/hidden
  - width
  - compact/expanded
  - split pos
- Estado en localStorage.
- Valorar guardar en cuenta luego de auth.
- Fix: mínimo 2 columnas en carpeta.
- Fix: quitar +new-chat en carpeta.
- Fix: quitar botón compacto muerto.
- Fix: tab de opener más ancho y separado del borde.
- Fix: scroll en Gemini no bloqueado cuando panel cerrado.

### 2.2 Carpeta + chats
- Drag & drop carpetas + crear al final.
- Mover chats entre carpetas / to unassigned.
- Bulk actions:
  - mover a carpeta.
  - agregar/quitar tags.
- No borrar chats reales en batch.
- Lista de todos los chats de Gemini + carga incremental:
  - primer indexing.
  - luego diffs para mantener fluidez.

### 2.3 Edición de chat
- Acción en chat -> dropdown:
  - rename
  - tags add/remove
  - remover de carpeta (unorganized)
  - guardar
- Tags serializados:
  - `chat title #tag1 #tag2`
- Renombre sincroniza con chat real de Gemini.

### 2.4 Import/Export
- Config button abre panel settings.
- Export JSON completo (`folders`, `chats`, `panel_state`).
- Import JSON / merge / validación schema.
- Versionado de payload.
- Restore sin perder datos existentes.

### 2.5 Sincronía de usuario
- Auth (Google / Gemini).
- Al conectar cuenta:
  - no perder datos locales
  - merge local + cloud
- Backup en Google y/o Gemini.
- Offline + sync on reconnect.

## 3) Tareas pequeñas (por grupo)

### Grupo A — UI panel
- A1: read/write panel state.
- A2: toggle tab UX.
- A3: min 2 cols.
- A4: eliminar botón dead.
- A5: compact mode clean.

### Grupo B — Carpeta/chat
- B1: `FolderManager` add/remove/move/getUnassigned.
- B2: render completo.
- B3: dragDrop.
- B4: bulk actions.

### Grupo C — Metadata/chat
- C1: rename persist.
- C2: tags CRUD + render.
- C3: naming con `#tag`.
- C4: persist explícito.

### Grupo D — Import/Export
- D1: panel settings.
- D2: export JSON.
- D3: import/merge/validate.
- D4: undo/restore.

### Grupo E — Gemini Gem workflow
- E1: carpeta->gem mapping.
- E2: crear chat nuevo usando gem.
- E3: folder with gem context creation.

### Grupo F — Auth + backup
- F1: Google Auth flow.
- F2: sync strategy.
- F3: cloud backup/restore.
- F4: transfer local->cloud on login.
- F5: periodic autosync.

## 4) Prioridad por complejidad

1. UI fixes.
2. Panel state.
3. Carpeta/chat move.
4. Import/export.
5. tags + rename sync.
6. all-chats + lazyload.
7. gem folder integration.
8. Google auth + backup.

## 5) Condiciones para release usable

- Panel estable + responsive.
- Carpeta/chat CRUD + organizador.
- Import/export.
- Rename+tags reflejados.
- Offline + login sin data loss.
- Tests unitarios y QA.

## 6) Señalador fix vs feature (tú lista)

- Fix:
  - +new chat en carpeta fuera.
  - modo compacto dummy.
  - no borrar chat real.
  - min 2 columnas.
  - add tags no funciona.
  - tab open/close UX.
- Feature:
  - preserve panel state.
  - folder ordering y push al final.
  - folder gem newchat.
  - import/export.
  - edit chat dropdown.
  - tags en nombre.
  - sync rename Gemini.
  - list all chats.
  - Google auth + backup.

## 7) Nota final
- Comenzar con A+B+C en PRs chicos para no romper.
- Extender a D+E y dejar F (auth) para final.

---

> Si querés, te paso en el próximo mensaje un template de GitHub issue/checklist para trackear y asignar rápido.
