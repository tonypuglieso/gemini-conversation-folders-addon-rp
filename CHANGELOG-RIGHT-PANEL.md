# CHANGELOG - Right Panel

## 0.1.0 (2026-03-30)

### Added
- Nuevo panel derecho `RightPanel` completo para organización de conversaciones.
- Interfaz redimensionable con persistencia de ancho en `Storage`.
- Soporte de arrastrar y soltar carpetas y chats.
- Acciones masivas (bulk actions): agregar / sacar chats de carpetas.
- Edición de chat y tags desde panel:
  - renombrar chat,
  - agregar/eliminar tags,
  - marcar chat no organizado.
- Se agrega `src/assets/emojis.json` y `ManualEmojiPicker` para picker de emojis/tags.
- Integración progresiva con `FolderManager`, `GeminiAdapter`, `AuthService`.
- Documentación de arquitectura y componentes actualizada con `docs/RIGHTPANEL.md`.

### Changed
- Correcciones en `Component.setSafeHTML` para evitar scripts y permitir trusted-types.
- `eventHandler` migrado a eventos `.onclick`/`.oninput` para evitar listeners duplicados.
- `app.js` inicializa correctamente panel y sidebar antes de cargar estado de carpetas.
- `manifest.json` / `options/options.js` / `package.json` ajustados para el nuevo flujo.
- CSS de `right-panel` integrado y ajustes de z-index para overlay y compatibilidad.

### Fixed
- Problemas de layout y orden de apilamiento del right panel tras elementos nativos de Gemini.
- Resolver recarga de página completa al crear chat nuevo, ahora sólo navega.
- Bug de selector de elementos en `RightPanel` y `FolderManager` API que rompía funciones de carpeta.
- `home` limpia campo de búsqueda.
- Eliminados íconos de lupa y botón redundante de ocultar panel.

### Notes
- Esta versión es un hito de implementación del panel derecho con foco en UX y estabilidad.
- Futuras versiones deberán pulir integración con GEMAS de Gemini, filtros de tags por carpeta y workflow de edición completa.
