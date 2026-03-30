// Importa los módulos necesarios
import { getActiveConversationId } from "./utils.js";
import UI from "./ui.js";
import Storage from "./services/Storage.js";
import FolderManager from "./services/FolderManager.js";
import DragAndDrop from "./dragAndDrop.js";
import EventHandler from "./eventHandler.js";
import OnboardingTour from "./components/OnboardingTour.js";

if (window.geminiOrganizerAppInstance) {
  console.warn(
    "Gemini Organizer: Intento de re-inicialización bloqueado. La instancia ya existe."
  );
} else {
  /**
   * Clase principal de la aplicación que inicializa y coordina todos los módulos.
   */
  class App {
    // ... constructor remains same ...
    constructor() {
      this.ui = new UI();
      this.storage = new Storage("geminiConversations");
      this.folderManager = new FolderManager(this.storage, this.ui);
      this.dragAndDropHandler = new DragAndDrop(
        this.storage,
        this.folderManager
      );
      this.eventHandler = new EventHandler(
        this.ui,
        this.folderManager,
        this.dragAndDropHandler
      );

      this.folderManager.setGeminiAdapter(this.ui.geminiAdapter);
      this.folderManager.setEventHandler(this.eventHandler);
      this.folderManager.setDragAndDropHandler(this.dragAndDropHandler);
      this.ui.rightPanelComponent.setDragAndDropHandler(this.dragAndDropHandler);

      this.isInitializing = false;
      this.observer = new MutationObserver(this.handleMutations.bind(this));

      chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

      this.lastUrl = window.location.href;
      this.isHandlingMutations = false; // Flag para evitar bucles en el observer
    }

    /**
     * Inicializa la aplicación.
     */
    async init() {
      if (!chrome.runtime?.id) return;
      this.isInitializing = true;
      try {
        // Asegura que el contenedor de notificaciones (toast) exista
        if (!document.getElementById("gemini-organizer-toast-container")) {
          const toastContainer = document.createElement("div");
          toastContainer.id = "gemini-organizer-toast-container";
          document.body.appendChild(toastContainer);
        }

        // 1. Configura el área de almacenamiento (sync o local)
        await this.setupStorage();

        // 2. Load User Settings (Density, Dimensions)
        await this.ui.rightPanelComponent.loadSettings();

        // Check onboarding
        const hasSeenOnboarding = await this.storage.getHasSeenOnboarding();
        if (!hasSeenOnboarding) {
          const tour = new OnboardingTour({
            onClose: async () => {
              await this.storage.setHasSeenOnboarding(true);
              // Abrir sidebar automáticamente para que el usuario vea la herramienta
              if (
                this.ui.sidebar &&
                this.ui.sidebar.classList.contains("hidden")
              ) {
                this.ui.toggleSidebarVisibility();
              }
            },
          });
          tour.mount(document.body);
        }

        // 2. Inyecta la UI (Primero el Panel Derecho para evitar bloqueos)
        await this.ui.addRightPanelTab();
        
        // 3. Intenta inyectar el botón en la barra lateral izquierda
        try {
          await this.ui.addToggleButton(this.eventHandler, this.folderManager);
        } catch (e) {
          console.warn("Gemini Organizer: No se pudo inyectar el botón en el sidebar izquierdo.", e);
        }

        // Ensure sidebar element is in the DOM before loading folders
        // (addToggleButton may have failed silently, but folders-list-ul must exist)
        if (!this.ui.sidebar) {
            await this.ui.initializeSidebar();
        }

        // 4. Carga y muestra las carpetas
        await this.folderManager.loadAndDisplayFolders();
        await this.ui.renderRightPanel(this.folderManager.folders, this.folderManager.allUniqueConversations);

        this.dragAndDropHandler.setupDraggableConversations();

        // 5. Actualiza indicadores y otros elementos visuales
        await this.updateFolderIndicator();
        this.updateSidebarSyncStatus();

        // 6. Inicia el observador para detectar cambios en la UI de Gemini
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        console.info("Gemini Organizer: Inicialización completada con éxito.");
      } catch (e) {
        console.error("Gemini Organizer: Error durante init():", e);
      } finally {
        this.isInitializing = false;
      }
    }

    /**
     * Configura el almacenamiento (sync/local).
     */
    async setupStorage() {
      const syncEnabled = await this.storage.getSyncEnabled();
      await this.storage.setStorageArea(syncEnabled ? "sync" : "local");
      return syncEnabled;
    }

    async updateSidebarSyncStatus() {
      const syncEnabled = await this.storage.getSyncEnabled();
      // Retrasa la configuración de la UI del sidebar para asegurar que el DOM esté listo
      // Aunque con el nuevo flujo, debería estar listo.
      if (!this.ui.sidebar) {
        await this.ui.initializeSidebar();
      }
      this.ui.updateSyncStatusIcon(syncEnabled);
      const optionsBtn = document.getElementById("open-options-btn");
      if (optionsBtn) {
        // Clonamos el nodo para eliminar listeners anteriores y evitar duplicados
        const newOptionsBtn = optionsBtn.cloneNode(true);
        optionsBtn.parentNode.replaceChild(newOptionsBtn, optionsBtn);
        newOptionsBtn.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "openOptionsPage" });
        });
      }
    }

    /**
     * Maneja las mutaciones del DOM para re-inyectar la UI si Gemini la elimina
     * y para actualizar el estado de "guardado" de las conversaciones.
     */
    async handleMutations() {
      if (!chrome.runtime?.id) return;
      if (this.isHandlingMutations) return;
      this.isHandlingMutations = true;

      // Desconectamos el observador temporalmente mientras hacemos nuestros propios cambios.
      this.observer.disconnect();

      try {
        // Comprueba si nuestro botón principal sigue en el DOM
        console.log("Gemini Organizer: Detectada mutación, verificando UI...");
        const leftButton = document.getElementById("gemini-organizer-wrapper");
        const rightPanel = document.getElementById("gemini-organizer-right-panel-root");

        if (!leftButton || !document.body.contains(leftButton)) {
           console.log("Gemini Organizer: Re-inyectando botón izquierdo.");
           await this.ui.addToggleButton(this.eventHandler, this.folderManager);
           this.updateSidebarSyncStatus();
        }

        if (!rightPanel || !document.body.contains(rightPanel)) {
           console.log("Gemini Organizer: Re-inyectando panel derecho.");
           await this.ui.addRightPanelTab();
           await this.folderManager.loadAndDisplayFolders();
           await this.ui.renderRightPanel(this.folderManager.folders, this.folderManager.allUniqueConversations);
        }

        // Actualiza los listeners de arrastrar y soltar y los iconos de "guardado"
        this.dragAndDropHandler.setupDraggableConversations();

        // Comprueba si la URL ha cambiado (navegación SPA)
        if (window.location.href !== this.lastUrl) {
          this.lastUrl = window.location.href;
          // Actualiza el indicador de carpeta para la nueva conversación
          await this.updateFolderIndicator();
        }
      } catch (error) {
        console.error("Error en handleMutations:", error);
      } finally {
        // Volvemos a conectar el observador para detectar futuros cambios de Gemini
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
        this.isHandlingMutations = false;
      }
    }

    /**
     * Actualiza el indicador que muestra si la conversación actual está en una carpeta.
     */
    async updateFolderIndicator() {
      try {
        // En primer lugar, verificar si hay un chat pendiente de auto-asignación
        await this.folderManager.checkAndAssignPendingChat();
        
        const currentConvId = getActiveConversationId();
        const folderName = await this.folderManager.findFolderForConversation(
          currentConvId
        );
        await this.ui.displayFolderIndicator(folderName);
      } catch (error) {
        console.error("Error al actualizar el indicador de carpeta:", error);
        this.ui.displayFolderIndicator(null);
      }
    }

    /**
     * Escucha cambios en el almacenamiento (local o sync).
     */
    async handleStorageChange(changes, namespace) {
      if (!chrome.runtime?.id) return;
      // Si la configuración de sync cambia, o los datos de sync cambian
      if (
        namespace === "sync" &&
        (changes.syncEnabled || changes[this.storage.key])
      ) {
        console.log("La configuración de Sync ha cambiado. Recargando...");
        await this.setupStorage();
        await this.folderManager.loadAndDisplayFolders();
        this.updateSidebarSyncStatus();
      }
      // Si los datos locales cambian (y sync está deshabilitado)
      else if (namespace === "local" && changes[this.storage.key]) {
        console.log(
          "El almacenamiento local ha cambiado. Recargando las carpetas."
        );
        await this.folderManager.loadAndDisplayFolders();
        this.ui.renderRightPanel(this.folderManager.folders, this.folderManager.allUniqueConversations);
      }
    }

    /**
     * Maneja mensajes de otras partes de la extensión (como el menú contextual).
     */
    handleMessage(request, sender, sendResponse) {
      if (request.action === "save_current_conversation_to_folder") {
        this.folderManager.saveCurrentConversation(request.folderName);
      }
      // Indica que la respuesta puede ser asíncrona (aunque aquí no lo sea, es buena práctica)
      return true;
    }
  }
  // Crea y almacena la instancia única en el objeto window
  window.geminiOrganizerAppInstance = new App();
  window.geminiOrganizerAppInstance.init();
}
