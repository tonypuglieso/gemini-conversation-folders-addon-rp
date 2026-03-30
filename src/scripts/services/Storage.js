export default class  Storage {
    constructor(key) {
        this.key = key;
        this.storageArea = null; 
    }

/**
     * Establece el área de almacenamiento y devuelve la instancia para encadenar.
     * @param {string} area - 'local' o 'sync'.
     */
    async setStorageArea(area) {
        this.storageArea = (area === 'sync') ? chrome.storage.sync : chrome.storage.local;
        console.log(`Área de almacenamiento establecida en: ${this.storageArea === chrome.storage.sync ? 'sync' : 'local'}`);
        return this; // Devolvemos la instancia
    }

    get area() {
        return this.storageArea || chrome.storage.local;
    }

    async getFolders() {
        if (!chrome.runtime?.id) return {};
        const data = await this.area.get(this.key);
        return data[this.key] || {};
    }

    async saveFolders(folders) {
        if (!chrome.runtime?.id) return;
        return this.area.set({ [this.key]: folders });
    }

    /**
     * Obtiene la configuración de sincronización del usuario.
     * @returns {Promise<boolean>} - true si la sincronización está habilitada, false en caso contrario.
     */
    async getSyncEnabled() {
        if (!chrome.runtime?.id) return false;
        const data = await chrome.storage.sync.get('syncEnabled');
        return data.syncEnabled || false;
    }

    /**
     * Guarda la configuración de sincronización del usuario.
     * @param {boolean} enabled - El estado de la sincronización.
     */
    async setSyncEnabled(enabled) {
        if (!chrome.runtime?.id) return;
        return chrome.storage.sync.set({ syncEnabled: enabled });
    }

    async getHasSeenOnboarding() {
        if (!chrome.runtime?.id) return true; // Asumir visto si falla el contexto para no molestar
        const data = await this.area.get('hasSeenOnboarding');
        return data.hasSeenOnboarding || false;
    }

    async setHasSeenOnboarding(seen) {
        if (!chrome.runtime?.id) return;
        return this.area.set({ hasSeenOnboarding: seen });
    }

    async getSettings() {
        if (!chrome.runtime?.id) return {
            density: 'compact',
            panelWidth: 340,
            foldersHeight: 40
        };
        const data = await this.area.get('gemini_organizer_settings');
        return data.gemini_organizer_settings || {
            density: 'compact',
            panelWidth: 340,
            foldersHeight: 40
        };
    }

    async saveSettings(settings) {
        if (!chrome.runtime?.id) return;
        return this.area.set({ gemini_organizer_settings: settings });
    }

    async getFolderOrder() {
        if (!chrome.runtime?.id) return [];
        const data = await this.area.get('folderOrder');
        return data.folderOrder || [];
    }

    async saveFolderOrder(order) {
        if (!chrome.runtime?.id) return;
        return this.area.set({ folderOrder: order });
    }
}