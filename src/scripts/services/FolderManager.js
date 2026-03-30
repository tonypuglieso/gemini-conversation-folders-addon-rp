import { showToast,extractRealConversationIdFromCurrentUrl,extractConversationTitle } from '../utils.js';

export default class FolderManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.geminiAdapter = null;
    }

    setGeminiAdapter(geminiAdapter) {
        this.geminiAdapter = geminiAdapter;
    }


    async loadAndDisplayFolders() {
        const openFolderStates = this.ui.getOpenFolderStates();
        const folders = await this.storage.getFolders();
        const folderOrder = await this.storage.getFolderOrder();
        
        // Re-order folders based on the manual order list
        const orderedFolders = {};
        if (folderOrder && folderOrder.length > 0) {
            folderOrder.forEach(name => {
                if (folders[name]) {
                    orderedFolders[name] = folders[name];
                }
            });
            // Add any folders that might be missing from the order (safety)
            for (const name in folders) {
                if (!orderedFolders[name]) {
                    orderedFolders[name] = folders[name];
                }
            }
        } else {
            // First time: capture current order
            Object.assign(orderedFolders, folders);
            await this.storage.saveFolderOrder(Object.keys(folders));
        }

        this.folders = orderedFolders;
        this.allUniqueConversations = this._extractUniqueConversations(orderedFolders);
        this.ui.renderFolders(orderedFolders, openFolderStates, this.eventHandler, this.dragAndDropHandler);
    }

    _extractUniqueConversations(folders) {
        const conversationsMap = new Map();
        
        for (const folderName in folders) {
            folders[folderName].forEach(conv => {
                if (!conversationsMap.has(conv.id)) {
                    conversationsMap.set(conv.id, { ...conv, folders: [folderName] });
                } else {
                    const existing = conversationsMap.get(conv.id);
                    if (!existing.folders.includes(folderName)) {
                        existing.folders.push(folderName);
                    }
                }
            });
        }
        
        return Array.from(conversationsMap.values());
    }

    async getUncategorizedConversations() {
        const allGeminiConv = this.geminiAdapter ? await this.geminiAdapter.getConversations() : [];
        const folders = await this.storage.getFolders();
        const categorizedIds = new Set();
        
        for (const f in folders) {
            folders[f].forEach(c => categorizedIds.add(c.id));
        }
        
        return allGeminiConv.filter(c => !categorizedIds.has(c.id));
    }

    async reorderFolders(fromIndex, toIndex) {
        const folderOrder = await this.storage.getFolderOrder();
        const [movedItem] = folderOrder.splice(fromIndex, 1);
        folderOrder.splice(toIndex, 0, movedItem);
        await this.storage.saveFolderOrder(folderOrder);
        return folderOrder;
    }

    async createFolder(folderName) {
        if (!folderName) {
            throw new Error("El nombre de la carpeta no puede estar vacío.");
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            throw new Error(`La carpeta "${folderName}" ya existe.`);
        }

        storedFolders[folderName] = [];
        await this.storage.saveFolders(storedFolders);
        
        // Add to order
        const folderOrder = await this.storage.getFolderOrder();
        folderOrder.push(folderName);
        await this.storage.saveFolderOrder(folderOrder);

        return true;
    }

    async renameFolder(originalFolderName, newFolderName) {
        if (!newFolderName) {
             throw new Error("El nombre de la carpeta no puede estar vacío.");
        }

        if (newFolderName === originalFolderName) {
            return false; // No changes needed
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[newFolderName]) {
             throw new Error(`Ya existe una carpeta con el nombre "${newFolderName}".`);
        }

        const folderContent = storedFolders[originalFolderName];
        if (!folderContent) {
             throw new Error(`La carpeta original "${originalFolderName}" no existe.`);
        }

        delete storedFolders[originalFolderName];
        storedFolders[newFolderName] = folderContent;
        await this.storage.saveFolders(storedFolders);

        // Update name in order list
        const folderOrder = await this.storage.getFolderOrder();
        const idx = folderOrder.indexOf(originalFolderName);
        if (idx !== -1) {
            folderOrder[idx] = newFolderName;
            await this.storage.saveFolderOrder(folderOrder);
        }

        return true;
    }

    async updateConversationMetadata(folderName, convId, newTitle, newTags) {
        const folders = await this.storage.getFolders();
        if (folders[folderName]) {
            const conv = folders[folderName].find(c => c.id === convId);
            if (conv) {
                conv.title = newTitle || conv.title;
                conv.tags = newTags || conv.tags || [];
                await this.storage.saveFolders(folders);
                return true;
            }
        }
        return false;
    }

    async deleteFolder(folderName) {
        if (!folderName) {
            throw new Error('Hubo un error al intentar eliminar la carpeta.');
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            delete storedFolders[folderName];
            await this.storage.saveFolders(storedFolders);
            
            // Remove from order list
            const folderOrder = await this.storage.getFolderOrder();
            const newOrder = folderOrder.filter(n => n !== folderName);
            await this.storage.saveFolderOrder(newOrder);

            return true;
        } else {
            throw new Error("La carpeta especificada no existe.");
        }
    }

    async deleteConversation(folderName, convId) {
        if (!folderName || !convId) {
            throw new Error('Hubo un error al intentar eliminar la conversación.');
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);
            await this.storage.saveFolders(storedFolders);
            return true;
        } else {
             throw new Error("La carpeta especificada no existe.");
        }
    }

    async addConversationToFolder(folderName, conversation) {
        if (!folderName || !conversation?.id) {
            return false;
        }

        const folders = await this.storage.getFolders();
        if (!folders[folderName]) {
            return false;
        }

        if (folders[folderName].some(conv => conv.id === conversation.id)) {
            return true;
        }

        let conversationData = {
            id: conversation.id,
            title: conversation.title || 'Sin título',
            url: conversation.url || window.location.href,
            timestamp: conversation.timestamp || new Date().toLocaleString(),
            tags: conversation.tags || []
        };

        if ((!conversation.title || !conversation.url) && this.geminiAdapter) {
            const visibleConversation = this.geminiAdapter.getVisibleChats().find(chat => chat.id === conversation.id);
            if (visibleConversation) {
                conversationData = {
                    ...conversationData,
                    title: visibleConversation.title || conversationData.title,
                    url: visibleConversation.url || conversationData.url
                };
            }
        }

        for (const folder of Object.values(folders)) {
            const existingConversation = folder.find(conv => conv.id === conversation.id);
            if (existingConversation) {
                conversationData = {
                    ...existingConversation,
                    ...conversationData
                };
                break;
            }
        }

        folders[folderName].push(conversationData);
        await this.storage.saveFolders(folders);
        return true;
    }

    async removeConversationFromFolder(folderName, convId) {
        if (!folderName || !convId) {
            return false;
        }

        const folders = await this.storage.getFolders();
        if (!folders[folderName]) {
            return false;
        }

        const originalLength = folders[folderName].length;
        folders[folderName] = folders[folderName].filter(conv => conv.id !== convId);
        if (folders[folderName].length === originalLength) {
            return false;
        }

        await this.storage.saveFolders(folders);
        return true;
    }



    async saveCurrentConversation(targetFolderName) {
        const url = window.location.href;
        const convId = extractRealConversationIdFromCurrentUrl();
        const convTitle = extractConversationTitle();

        if (!convId || !convTitle) {
            showToast("No se pudo obtener la información de la conversación actual.", 'error');
            return;
        }

        const storedFolders = await this.storage.getFolders();
        
        if (!storedFolders[targetFolderName]) {
             showToast(`La carpeta "${targetFolderName}" no existe.`, 'error');
             return;
        }

        const existingConversation = storedFolders[targetFolderName].find(c => c.id === convId);
        if (existingConversation) {
            showToast("Esta conversación ya está guardada en esta carpeta.", 'info');
            return;
        }

        storedFolders[targetFolderName].push({ id: convId, title: convTitle, url: url, timestamp: new Date().toLocaleString() });

        await this.storage.saveFolders(storedFolders);
        showToast(`Conversación guardada en la carpeta "${targetFolderName}".`, 'success');
    }

async findFolderForConversation(convId) {
        if (!convId) {
            return null;
        }

        try {
            // Verificamos si el runtime de chrome sigue activo antes de hacer la llamada.
            if (!chrome.runtime?.id) {
                console.warn("Gemini Organizer: Context invalidated, skipping folder check.");
                return null;
            }

            const storedFolders = await this.storage.getFolders();
            
            // Una segunda verificación por si el contexto se invalidó durante la llamada asíncrona.
            if (chrome.runtime.lastError) {
                console.warn("Gemini Organizer: Context invalidated during storage access.", chrome.runtime.lastError.message);
                return null;
            }

            for (const folderName in storedFolders) {
                const conversationExists = storedFolders[folderName].some(conv => conv.id === convId);
                if (conversationExists) {
                    return folderName;
                }
            }
            return null;
            
        } catch (error) {
            console.warn("Gemini Organizer: Could not check for folder (context likely invalidated).", error.message);
            return null; // En caso de error, simplemente no mostramos el indicador.
        }
    }



    async renameConversation(folderName, convId, newTitle) {
        if (!newTitle) throw new Error("El título no puede estar vacío.");
        
        const folders = await this.storage.getFolders();
        let found = false;

        // Rename in all folders where it might exist
        for (const f in folders) {
            const conv = folders[f].find(c => c.id === convId);
            if (conv) {
                conv.title = newTitle;
                found = true;
            }
        }

        if (found) {
            await this.storage.saveFolders(folders);
            
            // Sync with Gemini Native Sidebar
            if (this.geminiAdapter) {
                this.geminiAdapter.updateNativeChatTitle(convId, newTitle);
            }

            showToast(`Conversación renombrada a "${newTitle}"`, 'success');
            return true;
        }
        return false;
    }

    async addTagToConversation(folderName, convId, tag) {
        if (!tag) return false;
        const folders = await this.storage.getFolders();
        if (folders[folderName]) {
            const conv = folders[folderName].find(c => c.id === convId);
            if (conv) {
                if (!conv.tags) conv.tags = [];
                const cleanTag = tag.replace(/^#/, '').trim();
                if (cleanTag && !conv.tags.includes(cleanTag)) {
                    conv.tags.push(cleanTag);
                    await this.storage.saveFolders(folders);
                    return true;
                }
            }
        }
        return false;
    }

    async removeTagFromConversation(folderName, convId, tag) {
        const folders = await this.storage.getFolders();
        if (folders[folderName]) {
            const conv = folders[folderName].find(c => c.id === convId);
            if (conv && conv.tags) {
                conv.tags = conv.tags.filter(t => t !== tag);
                await this.storage.saveFolders(folders);
                return true;
            }
        }
        return false;
    }

    async setPendingFolderForNewChat(folderName) {
        if (!folderName) return;
        await chrome.storage.local.set({ pendingFolderForNewChat: folderName });
        showToast(`Siguiente chat se guardará en "${folderName}"`, 'info');
        // Redirigir a nuevo chat
        window.location.href = 'https://gemini.google.com/app';
    }

    async checkAndAssignPendingChat() {
        try {
            const { pendingFolderForNewChat } = await chrome.storage.local.get('pendingFolderForNewChat');
            if (!pendingFolderForNewChat) return;

            const convId = extractRealConversationIdFromCurrentUrl();
            if (!convId) return;

            // Evitar asignar chats genéricos o la home sin ID real
            if (window.location.pathname === '/app' || window.location.pathname === '/app/') return;

            const folders = await this.storage.getFolders();
            if (!folders[pendingFolderForNewChat]) {
                await chrome.storage.local.remove('pendingFolderForNewChat');
                return;
            }

            // Verificar si ya está en alguna carpeta para no duplicar si el usuario lo movió manualmente rápido
            const existingFolder = await this.findFolderForConversation(convId);
            if (existingFolder) {
                await chrome.storage.local.remove('pendingFolderForNewChat');
                return;
            }

            const title = extractConversationTitle();
            // Esperar a que el título no sea el por defecto de "Nuevo chat" si es posible
            if (!title || title === 'Nuevo chat' || title === 'Lienzo en blanco') return;

            folders[pendingFolderForNewChat].push({
                id: convId,
                title: title,
                url: window.location.href,
                timestamp: new Date().toLocaleString()
            });

            await this.storage.saveFolders(folders);
            await chrome.storage.local.remove('pendingFolderForNewChat');
            
            showToast(`¡Chat auto-asignado a "${pendingFolderForNewChat}"!`, 'success');
            
            // Forzar recarga de la UI
            await this.loadAndDisplayFolders();
        } catch (e) {
            console.error("Error auto-asignando chat:", e);
        }
    }

    async getUnorganizedChats() {
        if (!this.geminiAdapter || !this.folders) return [];
        
        const visibleChats = this.geminiAdapter.getVisibleChats();
        const organizedIds = new Set(this.allUniqueConversations.map(c => c.id));
        
        return visibleChats.filter(chat => !organizedIds.has(chat.id));
    }

    getAllTags() {
        const tagsMap = new Map();
        if (this.allUniqueConversations) {
            this.allUniqueConversations.forEach(conv => {
                if (conv.tags) {
                    conv.tags.forEach(tag => {
                        tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
                    });
                }
            });
        }
        return Array.from(tagsMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }

    async moveConversationsToFolder(convIds, sourceFolderName, targetFolderName) {
        if (!convIds || convIds.length === 0 || !targetFolderName) return;

        const folders = await this.storage.getFolders();
        if (!folders[targetFolderName]) return;

        // 1. Identify conversations to move
        let conversationsToMove = [];
        
        if (sourceFolderName === 'Recientes' || sourceFolderName === 'Sin Organizar') {
            // Scrape or find in visible list
            const visible = this.geminiAdapter.getVisibleChats();
            conversationsToMove = visible.filter(c => convIds.includes(c.id)).map(c => ({
                id: c.id,
                title: c.title,
                url: c.url,
                timestamp: new Date().toLocaleString()
            }));
        } else if (folders[sourceFolderName]) {
            conversationsToMove = folders[sourceFolderName].filter(c => convIds.includes(c.id));
            // Remove from source
            folders[sourceFolderName] = folders[sourceFolderName].filter(c => !convIds.includes(c.id));
        }

        // 2. Add to target (avoid duplicates)
        conversationsToMove.forEach(conv => {
            if (!folders[targetFolderName].some(exist => exist.id === conv.id)) {
                folders[targetFolderName].push(conv);
            }
        });

        await this.storage.saveFolders(folders);
        showToast(`${convIds.length} chats movidos a "${targetFolderName}"`, 'success');
        await this.loadAndDisplayFolders();
    }

    async deleteMultipleConversations(folderName, convIds) {
        if (!folderName || !convIds || convIds.length === 0) return;
        
        const folders = await this.storage.getFolders();
        if (folders[folderName]) {
            folders[folderName] = folders[folderName].filter(c => !convIds.includes(c.id));
            await this.storage.saveFolders(folders);
            showToast(`${convIds.length} chats eliminados de "${folderName}"`, 'success');
            await this.loadAndDisplayFolders();
        }
    }

    async exportBackup() {
        try {
            const folders = await this.storage.getFolders();
            const settings = await this.storage.getSettings();
            const backup = {
                version: "2.0",
                timestamp: new Date().toISOString(),
                folders: folders,
                settings: settings
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gemini-organizer-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            showToast("Respaldo creado correctamente", 'success');
        } catch (e) {
            showToast("Error al exportar respaldo", 'error');
        }
    }

    async importBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    if (backup.folders) {
                        await this.storage.saveFolders(backup.folders);
                        if (backup.settings) {
                            await this.storage.saveSettings(backup.settings);
                        }
                        showToast("Respaldo restaurado con éxito", 'success');
                        window.location.reload();
                    }
                } catch (err) {
                    showToast("Error al importar: archivo inválido", 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    setEventHandler(eventHandler) {
        this.eventHandler = eventHandler;
    }

    setDragAndDropHandler(dragAndDropHandler) {
        this.dragAndDropHandler = dragAndDropHandler;
    }
}
