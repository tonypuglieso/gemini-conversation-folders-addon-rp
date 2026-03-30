# Documentación del Componente: RightPanel

**Ubicación:** `src/scripts/components/RightPanel.js`

El componente `RightPanel` es el elemento central de la interfaz de usuario de la extensión. Se renderiza como un panel lateral en la parte derecha de la página de Gemini y encapsula toda la funcionalidad de organización de conversaciones.

## Responsabilidades

- **Estructura Principal:** Renderiza el contenedor principal del panel, la barra de herramientas superior y el área donde se mostrará la lista de carpetas.
- **Gestión de la Interfaz:** Controla la visibilidad de sub-componentes como la barra de búsqueda y los menús de configuración.
- **Orquestación de Componentes Hijos:** Es responsable de instanciar y pasar los datos necesarios al componente `FolderList`.
- **Manejo de Eventos Globales:** Captura eventos de la barra de herramientas (ej: "Crear Carpeta", "Buscar", "Configuración") y delega las acciones correspondientes a los servicios o gestores apropiados (como `FolderManager`).

## Estado (`this.state`)

El estado del `RightPanel` puede incluir propiedades como:
- `isSearchVisible`: Un booleano para mostrar u ocultar la barra de búsqueda.
- `searchTerm`: El término de búsqueda actual introducido por el usuario.
- `folders`: Una copia de las carpetas a renderizar.
- `conversations`: Una lista de todas las conversaciones para la búsqueda.

## Métodos Principales

- **`render()`**: Genera el HTML del esqueleto del panel, incluyendo la barra de herramientas y los contenedores para los hijos.
- **`afterRender()`**: Asigna los `event listeners` a los botones de la barra de herramientas (Crear, Buscar, etc.).
- **`updateData(folders, conversations)`**: Método público llamado desde `App` o `UI` para proporcionar los datos más recientes. Al recibir nuevos datos, actualiza su estado interno y vuelve a renderizar sus componentes hijos (`FolderList`).
- **`setDragAndDropHandler(handler)`**: Recibe la instancia del manejador de Drag & Drop para pasársela a los componentes hijos que la necesiten.

## Interacción con Otros Módulos

- **`FolderManager`**: `RightPanel` invoca métodos de `FolderManager` cuando el usuario realiza acciones como crear una nueva carpeta.
- **`FolderList`**: `RightPanel` instancia `FolderList` y le pasa las carpetas y conversaciones que debe mostrar.
- **`UI` / `App`**: Es instanciado y gestionado por la capa superior, que le provee de los datos y dependencias necesarias.