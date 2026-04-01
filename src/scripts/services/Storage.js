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
        // Try chrome.storage first; if no data present, fallback to any legacy localStorage data.
        if (!chrome.runtime?.id) {
            if (typeof localStorage !== 'undefined') {
                try {
                    const stored = localStorage.getItem(this.key);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed && typeof parsed === 'object') {
                            return parsed;
                        }
                    }
                } catch (e) {
                    console.warn('Storage: localStorage getFolders parse error', e);
                }
            }
            return {};
        }

        try {
            const data = await this.area.get(this.key);
            const folders = data[this.key] || {};

            if (folders && typeof folders === 'object' && Object.keys(folders).length > 0) {
                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem(this.key, JSON.stringify(folders));
                    } catch (e) {
                        console.warn('Storage: localStorage setFolders failed', e);
                    }
                }
                return folders;
            }

            // If chrome storage is empty, fall back to localStorage (migration path)
            if (typeof localStorage !== 'undefined') {
                try {
                    const stored = localStorage.getItem(this.key);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed && typeof parsed === 'object') {
                            // Sync back to chrome.storage to persist
                            await this.area.set({ [this.key]: parsed });
                            return parsed;
                        }
                    }
                } catch (e) {
                    console.warn('Storage: localStorage getFolders parse error', e);
                }
            }

            return folders;
        } catch (e) {
            console.warn('Storage: chrome.storage getFolders failed', e);
            return {};
        }
    }

    async saveFolders(folders) {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.key, JSON.stringify(folders));
            } catch (e) {
                console.warn('Storage: localStorage saveFolders failed', e);
            }
        }

        if (!chrome.runtime?.id) return;

        try {
            return await this.area.set({ [this.key]: folders });
        } catch (e) {
            console.warn('Storage: chrome.storage saveFolders failed', e);
        }
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
        const defaultSettings = {
            density: 'compact',
            panelWidth: 340,
            foldersHeight: 40
        };

        // Prefer extension storage when available
        if (chrome.runtime?.id) {
            try {
                const data = await this.area.get('gemini_organizer_settings');
                const settings = data.gemini_organizer_settings || defaultSettings;
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('gemini_organizer_settings', JSON.stringify(settings));
                }
                return settings;
            } catch (e) {
                console.warn('Storage: Error reading settings from chrome.storage, falling back to localStorage', e);
            }
        }

        // Fallback to localStorage if extension storage is unavailable
        if (typeof localStorage !== 'undefined') {
            try {
                const stored = localStorage.getItem('gemini_organizer_settings');
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (e) {
                console.warn('Storage: LocalStorage getSettings parse error', e);
            }
        }

        return defaultSettings;
    }

    async saveSettings(settings) {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('gemini_organizer_settings', JSON.stringify(settings));
            } catch (e) {
                console.warn('Storage: LocalStorage saveSettings failed', e);
            }
        }

        if (!chrome.runtime?.id) return;
        return this.area.set({ gemini_organizer_settings: settings });
    }

    async getFolderOrder() {
        if (!chrome.runtime?.id) {
            if (typeof localStorage !== 'undefined') {
                try {
                    const stored = localStorage.getItem('folderOrder');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    }
                } catch (e) {
                    console.warn('Storage: localStorage getFolderOrder parse error', e);
                }
            }
            return [];
        }

        try {
            const data = await this.area.get('folderOrder');
            const folderOrder = data.folderOrder || [];

            if (Array.isArray(folderOrder) && folderOrder.length > 0) {
                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem('folderOrder', JSON.stringify(folderOrder));
                    } catch (e) {
                        console.warn('Storage: localStorage setFolderOrder failed', e);
                    }
                }
                return folderOrder;
            }

            if (typeof localStorage !== 'undefined') {
                try {
                    const stored = localStorage.getItem('folderOrder');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            await this.area.set({ folderOrder: parsed });
                            return parsed;
                        }
                    }
                } catch (e) {
                    console.warn('Storage: localStorage getFolderOrder parse error', e);
                }
            }

            return folderOrder;
        } catch (e) {
            console.warn('Storage: chrome.storage getFolderOrder failed', e);
            return [];
        }
    }

    async saveFolderOrder(order) {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('folderOrder', JSON.stringify(order));
            } catch (e) {
                console.warn('Storage: localStorage saveFolderOrder failed', e);
            }
        }

        if (!chrome.runtime?.id) return;

        try {
            return await this.area.set({ folderOrder: order });
        } catch (e) {
            console.warn('Storage: chrome.storage saveFolderOrder failed', e);
        }
    }
}