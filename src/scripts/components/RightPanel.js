import Component from '../core/Component.js';
import AuthService from '../services/AuthService.js';
import { showToast } from '../utils.js';
import ManualEmojiPicker from './ManualEmojiPicker.js';

export default class RightPanel extends Component {
    constructor(props = {}) {
        super({ ...props, useShadow: false, id: 'gemini-organizer-right-panel' });
        this.isOpen = false;
        this.currentFolderView = null;
        this.isBulkMode = false;
        this.selectedConvIds = new Set();
        this.settings = { density: 'compact', panelWidth: 340, foldersHeight: 40 };
        this.auth = new AuthService();
        this.user = null;
        this.lastData = { folders: {}, conversations: [] };
        
        // Final SVG Dictionary (Material Style, Thin Strokes, Stable)



        const s = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
        this.svg = {
            home: `<svg viewBox="0 0 24 24" ${s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            search: `<svg viewBox="0 0 24 24" ${s}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            close: `<svg viewBox="0 0 24 24" ${s}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            newChat: `<svg viewBox="0 0 24 24" ${s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
            folder: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>`,
            edit: `<svg viewBox="0 0 24 24" ${s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
            delete: `<svg viewBox="0 0 24 24" ${s}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
            mood: `<svg viewBox="0 0 24 24" ${s}><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`,
            chevronLeft: `<svg viewBox="0 0 24 24" ${s}><polyline points="15 18 9 12 15 6"></polyline></svg>`,
            chevronRight: `<svg viewBox="0 0 24 24" ${s}><polyline points="9 18 15 12 9 6"></polyline></svg>`,
            plus: `<svg viewBox="0 0 24 24" ${s}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
            moreVert: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>`,
            select: `<svg viewBox="0 0 24 24" ${s}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
            settings: `<svg viewBox="0 0 24 24" ${s}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
            tools: `<svg viewBox="0 0 24 24" ${s}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`
        };




        // Bind methods
        this.toggle = this.toggle.bind(this);
        this.showEditChatPanel = this.showEditChatPanel.bind(this);
        this.showDeleteChatPanel = this.showDeleteChatPanel.bind(this);
        this.showDeleteTagPanel = this.showDeleteTagPanel.bind(this);
        this.showDataManagementPanel = this.showDataManagementPanel.bind(this);
        this.dragAndDropHandler = null;
    }

    setDragAndDropHandler(handler) {
        this.dragAndDropHandler = handler;
    }

    getVisiblePanelElement() {
        return this.element?.querySelector('#gemini-organizer-right-panel') || this.element;
    }






    render() {
        return `
            <div id="gemini-organizer-right-panel-root">
                <!-- Floating Toggle Handle (Always outside the translate container) -->
                <div id="gemini-organizer-right-panel-tab" class="drawer-handle">
                    <div class="handle-inner" id="drawer-handle-icon">
                        ${this.svg.chevronLeft}
                    </div>
                </div>

                <!-- Main Panel Container (This one gets the .hidden class and translates) -->
                <div id="gemini-organizer-right-panel" class="hidden">
                    <div class="right-panel-resizer" id="right-panel-resizer"></div>
                    
                    <div class="panel-container">
                        <!-- Header with Home & Search -->
                        <div class="right-panel-header">
                            <button class="header-btn" id="right-back-btn" title="Volver al inicio">
                                ${this.svg.home}
                            </button>
                            <div class="header-search-container">
                                <input type="search" id="right-panel-search" placeholder="Buscar conversaciones...">
                            </div>
                                <button class="header-btn" id="right-settings-btn" title="Herramientas y Backup">
                                    ${this.svg.tools}
                                </button>
                            </div>

                        <div class="panel-content" id="right-panel-content-area">
                            <!-- TAGS BAR -->
                            <div id="right-tags-bar" class="tags-bar"></div>

                            <!-- CARPETAS SECTION -->
                            <div class="section-group" id="folders-main-container">
                                <div class="section-header-row">
                                    <h2 class="section-title">Carpetas</h2>
                                    <button class="new-chat-btn" id="right-add-folder-btn" title="Nueva Carpeta">
                                        ${this.svg.folder} Nueva carpeta
                                    </button>
                                </div>
                                <div class="folders-grid" id="right-folders-grid"></div>
                            </div>

                            <div class="section-divider" id="right-panel-divider"></div>

                            <!-- CONVERSACIONES SECTION -->
                            <div class="section-group" id="conversations-main-container">
                                <div id="right-panel-tag-cloud" class="tag-cloud-container"></div>
                                
                                <div class="section-header-row">
                                    <h2 class="section-title" id="right-list-title">Recientes</h2>
                                    <div class="convo-header-actions">
                                        <button class="bulk-toggle-btn" id="right-bulk-toggle" title="Seleccionar varios">
                                            ${this.svg.select}
                                        </button>
                                        <button class="new-chat-btn" id="right-new-chat-folder-btn" style="display: none;">
                                            ${this.svg.newChat} Nuevo chat
                                        </button>
                                    </div>
                                </div>
                                <ul id="right-all-conversations-list" class="conversation-list"></ul>
                            </div>
                        </div>

                        <!-- Bulk Action Bar -->
                        <div id="right-bulk-action-bar" class="bulk-action-bar hidden">
                            <span id="bulk-selection-count">0 seleccionados</span>
                            <div class="bulk-bar-actions">
                                <button class="bulk-move-btn primary">Mover a...</button>
                                <button class="bulk-remove-btn">Sacar de carpeta</button>
                                <button class="bulk-delete-btn danger">Borrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return ''; // Styles are in right-panel.css
    }

    afterRender() {
        if (!this.element) return;

        const backBtn = this.element.querySelector('#right-back-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                this.searchTerm = '';
                const searchInput = this.element.querySelector('#right-panel-search');
                if (searchInput) searchInput.value = '';
                this.currentFolderView = null;
                this.updateData();
            };
        }

        const closeBtn = this.element.querySelector('#close-right-panel');
        if (closeBtn) closeBtn.onclick = () => this.toggle(false);

        const handle = this.element.querySelector('.drawer-handle');
        if (handle) {
            handle.onclick = (e) => {
                e.stopPropagation();
                this.toggle();
            };
        }

        const toolsBtn = this.element.querySelector('#right-settings-btn');
        if (toolsBtn) {
            toolsBtn.onclick = (e) => {
                e.stopPropagation();
                this.showSettingsMenu();
            };
        }

        const searchInput = this.element.querySelector('#right-panel-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.updateData();
            };
        }

        // Bulk Management
        const bulkBtn = this.element.querySelector('#right-bulk-toggle');
        if (bulkBtn) {
            bulkBtn.classList.toggle('active', this.isBulkMode);
            bulkBtn.onclick = () => {
                this.isBulkMode = !this.isBulkMode;
                if (!this.isBulkMode) this.selectedConvIds.clear();
                this.updateData();
                this.updateBulkBar();
            };
        }

        this.element.querySelectorAll('.bulk-checkbox').forEach(cb => {
            cb.onchange = () => {
                const item = cb.closest('.conversation-item');
                const id = item.dataset.convId;
                if (cb.checked) {
                    this.selectedConvIds.add(id);
                    item.classList.add('selected');
                } else {
                    this.selectedConvIds.delete(id);
                    item.classList.remove('selected');
                }
                this.updateBulkBar();
            };
        });

        const bulkBar = this.element.querySelector('#right-bulk-action-bar');
        if (bulkBar) {
            bulkBar.querySelector('.bulk-move-btn').onclick = () => this.handleBulkMove();
            bulkBar.querySelector('.bulk-remove-btn').onclick = () => this.handleBulkRemove();
            bulkBar.querySelector('.bulk-delete-btn').onclick = () => this.handleBulkDelete();
        }

        const addFolderBtn = this.element.querySelector('#right-add-folder-btn');
        if (addFolderBtn) {
            addFolderBtn.onclick = (e) => {
                e.stopPropagation();
                this.showEditFolderPanel(null);
            };
        }

        // Global Clicks
        if (!this._globalClickListener) {
            this._globalClickListener = (e) => {
                const editPanel = document.querySelector('#folder-edit-panel');
                const emojiPicker = document.querySelector('#manual-emoji-picker');
                
                if (editPanel && !editPanel.contains(e.target) && !e.target.closest('.folder-menu-trigger')) {
                    editPanel.remove();
                }
                if (emojiPicker && !emojiPicker.contains(e.target) && !e.target.closest('#emoji-picker-trigger')) {
                    emojiPicker.remove();
                }

                // If user clicks on Gemini main area, close panel if open
                const geminiMain = document.querySelector('chat-window, main, .conversation-container');
                if (geminiMain && geminiMain.contains(e.target) && this.isOpen) {
                    if (!this.element.contains(e.target)) {
                        this.toggle(false);
                    }
                }
            };
            document.addEventListener('click', this._globalClickListener);
        }

        this.initResizers();

        if (this.dragAndDropHandler) {
            this.element.querySelectorAll('.folder-card:not(.virtual-folder)').forEach(card => {
                card.ondragover = this.dragAndDropHandler.handleDragOver.bind(this.dragAndDropHandler);
                card.ondragleave = this.dragAndDropHandler.handleDragLeave.bind(this.dragAndDropHandler);
                card.ondrop = async (e) => {
                    await this.dragAndDropHandler.handleDrop(e);
                    this.updateData();
                };
            });
        }
    }

    /**
     * Mounts the component to a parent container.
     * @param {HTMLElement} container 
     */
    mount(container) {
        console.group("Gemini Organizer: Proceso de Montaje del Panel Derecho");
        try {
            const el = this.create();
            if (!el) {
                console.error("RightPanel: Fallo crítico: create() no devolvió un elemento.");
                return;
            }
            container.appendChild(el);
            console.log("RightPanel: Elemento inyectado en:", container.tagName);
            console.log("RightPanel: Elemento raíz:", el.id);
            console.log("RightPanel: Estilos calculados iniciales:", window.getComputedStyle(el).display);
        } catch (e) {
            console.error("RightPanel: Error durante el montaje:", e);
        } finally {
            console.groupEnd();
        }
    }

    async updateData(folders, allUniqueConversations) {
        if (folders) this.lastData.folders = folders;
        if (allUniqueConversations) this.lastData.conversations = allUniqueConversations;

        if (!this.element) return;

        const grid = this.element.querySelector('#right-folders-grid');
        const list = this.element.querySelector('#right-all-conversations-list');
        const listTitle = this.element.querySelector('#right-list-title');

        // Update Folder Grid
        if (grid) {
            this.setSafeHTML(grid, '');
            
            // 1. Virtual Folder: Unorganized
            if (window.geminiOrganizerAppInstance && !this.currentFolderView) {
                const unorganized = window.geminiOrganizerAppInstance.folderManager.getUnorganizedChats();
                if (unorganized.length > 0) {
                    grid.appendChild(this.renderFolderCard('Sin Organizar', unorganized.length, true));
                }
            }

            let folderIdx = 0;
            for (const folderName in this.lastData.folders) {
                // Filter folders by search term
                if (this.searchTerm && !folderName.toLowerCase().includes(this.searchTerm)) continue;
                
                grid.appendChild(this.renderFolderCard(folderName, this.lastData.folders[folderName].length, false, folderIdx++));
            }
        }


        // Update Tag Cloud
        this.renderTagCloud();


        // Update Conversation List
        if (list) {
            this.setSafeHTML(list, '');
            let displayConvs = [];
            if (this.currentFolderView === 'Sin Organizar') {
                displayConvs = window.geminiOrganizerAppInstance.folderManager.getUnorganizedChats();
            } else {
                displayConvs = this.currentFolderView 
                    ? (this.lastData.folders[this.currentFolderView] || [])
                    : this.lastData.conversations;
            }

            
            if (this.searchTerm) {
                displayConvs = displayConvs.filter(c => 
                    c.title.toLowerCase().includes(this.searchTerm) || 
                    (c.tags || []).some(t => t.toLowerCase().includes(this.searchTerm))
                );
            }

            if (listTitle) {
                listTitle.textContent = this.currentFolderView || 'Recientes';
                listTitle.style.color = (this.currentFolderView && this.currentFolderView !== 'Sin Organizar') ? 'var(--rp-accent)' : '';
                if (this.currentFolderView === 'Sin Organizar') listTitle.style.color = '#fbbc04';
            }

            // Mostrar el botón contextual solo cuando estamos dentro de una carpeta real.
            const newChatBtn = this.element.querySelector('#right-new-chat-folder-btn');
            if (newChatBtn) {
                const shouldShowNewChat = !!(this.currentFolderView && this.currentFolderView !== 'Sin Organizar');
                newChatBtn.style.display = shouldShowNewChat ? 'flex' : 'none';
                newChatBtn.onclick = shouldShowNewChat && window.geminiOrganizerAppInstance
                    ? () => window.geminiOrganizerAppInstance.folderManager.setPendingFolderForNewChat(this.currentFolderView)
                    : null;
            }

            if (displayConvs.length === 0) {
                this.setSafeHTML(list, `<li class="empty-msg">${this.searchTerm ? 'No se encontraron resultados.' : 'Sin chats guardados.'}</li>`);
            } else {
                const currentFolderName = this.currentFolderView || 'Recientes';
                displayConvs.forEach(conv => {
                    list.appendChild(this.renderConversationItem(conv, currentFolderName));
                });
            }
        }
    }

    renderTagCloud() {
        const container = this.element.querySelector('#right-panel-tag-cloud');
        if (!container || !window.geminiOrganizerAppInstance) return;

        const tags = window.geminiOrganizerAppInstance.folderManager.getAllTags();
        if (tags.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        this.setSafeHTML(container, tags.map(tag => `
            <span class="tag-chip ${this.searchTerm === tag.name ? 'active' : ''}" data-tag="${tag.name}">
                #${tag.name} <span class="tag-count">${tag.count}</span>
            </span>
        `).join(''));

        container.querySelectorAll('.tag-chip').forEach(chip => {
            chip.onclick = () => {
                const tag = chip.dataset.tag.toLowerCase().trim();
                const input = this.element.querySelector('#right-panel-search');
                if (this.searchTerm === tag) {
                    this.searchTerm = '';
                    if (input) input.value = '';
                } else {
                    this.searchTerm = tag;
                    if (input) input.value = tag;
                }
                this.updateData();
            };
        });
    }


    renderFolderCard(folderName, count, isVirtual = false, index = 0) {
        const div = document.createElement('div');
        div.className = 'folder-card';
        if (!isVirtual) div.dataset.folderName = folderName;
        if (isVirtual) div.classList.add('virtual-folder');
        else div.classList.add(`folder-accent-${(index % 6) + 1}`);
        
        if (this.currentFolderView === folderName) div.classList.add('selected');



        // Extract emoji if present using Intl.Segmenter for complex sequences (e.g., Black Cat 🐈‍⬛)
        let emoji = null;
        let displayName = folderName;
        
        try {
            const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
            const segments = Array.from(segmenter.segment(folderName));
            
            if (segments.length > 0) {
                const firstSegment = segments[0].segment;
                if (/\p{Emoji}/u.test(firstSegment)) {
                    emoji = firstSegment;
                    displayName = folderName.slice(emoji.length).trim();
                }
            }
        } catch (e) {
            // Fallback for older environments if needed
            const emojiMatch = folderName.match(/^(\p{Emoji})/u);
            emoji = emojiMatch ? emojiMatch[1] : null;
            displayName = emoji ? folderName.replace(emoji, '').trim() : folderName;
        }

        this.setSafeHTML(div, `
            <div class="folder-icon-wrapper">
                ${isVirtual ? `<span class="folder-emoji-large">⚡</span>` : (emoji ? `<span class="folder-emoji-large">${emoji}</span>` : `
                <span class="folder-emoji-large">📂</span>
                `)}
            </div>
            <div class="folder-label-wrapper">
                <span class="folder-name">${displayName}</span>
                <span class="folder-count">${count}</span>
            </div>
            ${isVirtual ? '' : `
            <button class="folder-menu-trigger" title="Editar carpeta">
                ${this.svg.edit}
            </button>
            `}
        `);
        
        const trigger = div.querySelector('.folder-menu-trigger');
        if (trigger) trigger.onclick = (e) => {
            e.stopPropagation();
            this.showEditFolderPanel(folderName);
        };

        // Point 13: Drag Chat to Folder Drop Zone
        div.ondragover = (e) => {
            if (e.dataTransfer.types.includes('application/x-gemini-chat')) {
                e.preventDefault();
                div.classList.add('drag-over');
            }
        };
        div.ondragleave = () => div.classList.remove('drag-over');
        div.ondrop = async (e) => {
            div.classList.remove('drag-over');
            e.preventDefault();

            if (!window.geminiOrganizerAppInstance) return;
            const fm = window.geminiOrganizerAppInstance.folderManager;

            let ids = [];
            let sourceFolder = null;
            let conversations = [];

            const jsonData = e.dataTransfer.getData('application/json');
            if (jsonData) {
                try {
                    const payload = JSON.parse(jsonData);
                    if (payload) {
                        ids = Array.isArray(payload.ids) ? payload.ids : payload.id ? [payload.id] : [];
                        sourceFolder = payload.folder_from || null;
                        conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
                    }
                } catch (err) {
                    console.warn('RightPanel: no se pudo parsear payload JSON de drag and drop', err);
                }
            }

            // Legacy fallback
            if (ids.length === 0) {
                const chatId = e.dataTransfer.getData('application/x-gemini-chat');
                const bulkIds = e.dataTransfer.getData('application/x-gemini-chats-bulk');
                if (bulkIds) {
                    ids = bulkIds.split(',').map(s => s.trim()).filter(Boolean);
                } else if (chatId) {
                    ids = [chatId];
                }
            }

            if (ids.length > 0) {
                // Enviar la lista de ids a carpeta de destino, con source
                await fm.moveConversationsToFolder(ids, sourceFolder, folderName);
                this.updateData();
                showToast(`${ids.length} chat${ids.length > 1 ? 's' : ''} movido${ids.length > 1 ? 's' : ''} a ${folderName}`, 'success');
                return;
            }

            // Fallback específico: agregar manualmente si no hay move path
            if (ids.length === 0 && conversations.length > 0) {
                for (const conv of conversations) {
                    await fm.addConversationToFolder(folderName, {
                        id: conv.id,
                        title: conv.title,
                        url: conv.url
                    });
                }
                this.updateData();
                showToast(`${conversations.length} chat${conversations.length > 1 ? 's' : ''} movido${conversations.length > 1 ? 's' : ''} a ${folderName}`, 'success');
            }
        };

        
        div.onclick = (e) => {
            if (e.target.closest('.card-action-btn')) return;
            this.currentFolderView = folderName;
            this.updateData();
        };

        return div;
    }


    showEditFolderPanel(folderName = null) {
        const isEdit = !!folderName;
        
        let currentEmoji = '📂';
        let currentPureName = '';

        if (isEdit) {
            try {
                const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
                const segments = Array.from(segmenter.segment(folderName));
                if (segments.length > 0 && /\p{Emoji}/u.test(segments[0].segment)) {
                    currentEmoji = segments[0].segment;
                    currentPureName = folderName.slice(currentEmoji.length).trim();
                } else {
                    currentPureName = folderName;
                }
            } catch (e) {
                const emojiMatch = folderName.match(/^(\p{Emoji})/u);
                currentEmoji = emojiMatch ? emojiMatch[1] : '📂';
                currentPureName = folderName.replace(/^(\p{Emoji})/u, '').trim();
            }
        }

        // Remove existing
        const existing = document.querySelector('#folder-edit-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'folder-edit-panel';
        panel.className = 'premium-edit-panel';
        
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>${isEdit ? 'Editar Carpeta' : 'Nueva Carpeta'}</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <div class="edit-row">
                    <div class="emoji-input-wrapper-btn" id="emoji-picker-trigger" title="Cambiar emoji">
                        <span id="current-edit-emoji">${currentEmoji}</span>
                    </div>
                    <input type="text" id="edit-folder-name" placeholder="Nombre carpeta" value="${currentPureName}">
                </div>
                <div class="edit-actions">
                    ${isEdit ? `<button class="delete-btn danger">${this.svg.delete} Borrar</button>` : ''}
                    <div style="flex: 1"></div>
                    <button class="save-btn primary">Guardar</button>
                </div>
            </div>
        `);

        panel.onclick = (e) => e.stopPropagation(); // Avoid triggering global outside-click for anything in panel
        
        document.body.appendChild(panel);

        // Center the edit panel horizontally over the sidebar container for best visibility
        const sidebarRect = this.getVisiblePanelElement().getBoundingClientRect();
        const panelWidth = 280;
        const panelHeight = 220; // Estimated height

        // Horizontal centering over sidebar
        let left = sidebarRect.left + (sidebarRect.width - panelWidth) / 2;
        
        // Vertical positioning
        let top = isEdit ? this.getVisiblePanelElement().querySelector(`[data-folder-name="${folderName}"]`)?.getBoundingClientRect().top || 150 : 150;
        
        // Boundary checks
        if (top + panelHeight > window.innerHeight - 20) {
            top = window.innerHeight - panelHeight - 20;
        }

        panel.style.top = `${Math.max(10, top)}px`;
        panel.style.left = `${Math.max(10, left)}px`;

        const nameInput = panel.querySelector('#edit-folder-name');
        nameInput.focus();
        nameInput.select();

        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();

        const emojiTrigger = panel.querySelector('#emoji-picker-trigger');
        emojiTrigger.onclick = (e) => {
            e.stopPropagation();
            this.showEmojiPicker(emojiTrigger, (emoji) => {
                panel.querySelector('#current-edit-emoji').textContent = emoji;
            });
        };
        
        const handleSave = async () => {
            const newEmoji = panel.querySelector('#current-edit-emoji').textContent.trim();
            const newPureName = nameInput.value.trim();
            if (!newPureName) return;

            const finalName = newEmoji ? `${newEmoji} ${newPureName}` : newPureName;

            try {
                if (isEdit) {
                    await window.geminiOrganizerAppInstance.folderManager.renameFolder(folderName, finalName);
                    if (this.currentFolderView === folderName) this.currentFolderView = finalName;
                } else {
                    await window.geminiOrganizerAppInstance.folderManager.createFolder(finalName);
                }
                this.updateData();
                panel.remove();
            } catch (e) {
                showToast(e.message, 'error');
            }
        };

        panel.querySelector('.save-btn').onclick = handleSave;
        nameInput.onkeydown = (e) => { if (e.key === 'Enter') handleSave(); };

        if (isEdit) {
            panel.querySelector('.delete-btn').onclick = async () => {
                if (confirm(`¿Eliminar "${folderName}"?`)) {
                    await window.geminiOrganizerAppInstance.folderManager.deleteFolder(folderName);
                    if (this.currentFolderView === folderName) this.currentFolderView = null;
                    this.updateData();
                    panel.remove();
                }
            };
        }

        // Close on escape
        const escListener = (e) => {
            if (e.key === 'Escape') {
                panel.remove();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);
    }

    showEmojiPicker(triggerElement, onSelect) {
        const existing = document.querySelector('#manual-emoji-picker');
        if (existing) {
            existing.remove();
            return;
        }

        const picker = new ManualEmojiPicker({
            onSelect: (emoji) => {
                onSelect(emoji);
                picker.element.remove();
            }
        });
        
        const pickerEl = picker.create();
        const panel = document.querySelector('#folder-edit-panel');
        if (panel) {
            panel.appendChild(pickerEl);
        } else {
            document.body.appendChild(pickerEl);
        }

        const rect = triggerElement.getBoundingClientRect();
        const panelRect = panel ? panel.getBoundingClientRect() : { top: 0, left: 0 };
        
        // Match the panel structure precisely
        // Since picker is inside padded panel (16px), offset it to align with edges
        pickerEl.style.position = 'absolute';
        pickerEl.style.left = '-1px'; // Align with border
        pickerEl.style.width = 'calc(100% + 2px)';
        pickerEl.style.top = `${rect.bottom - panelRect.top + 8}px`;
        pickerEl.style.zIndex = '2000001';

        const closePicker = (e) => {
            if (!pickerEl.contains(e.target) && !triggerElement.contains(e.target)) {
                e.stopPropagation();
                pickerEl.remove();
                document.removeEventListener('mousedown', closePicker);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closePicker), 0);
    }


    renderConversationItem(conv, folder) {
        const li = document.createElement('li');
        li.className = 'conversation-item';
        if (this.isBulkMode) li.classList.add('bulk-mode');
        if (this.selectedConvIds.has(conv.id)) li.classList.add('selected');
        li.dataset.convId = conv.id;
        
        // Point 13: Drag Chat
        li.draggable = true;
        li.ondragstart = (e) => {
            const selectedIds = this.isBulkMode && this.selectedConvIds.has(conv.id) ? Array.from(this.selectedConvIds) : [conv.id];
            const conversationsMeta = selectedIds.map(id => {
                if (id === conv.id) {
                    return { id: conv.id, title: conv.title || 'Sin título', url: conv.url || '' };
                }
                // Fallback: use last-data lookup for extra selected items
                const found = (this.lastData.conversations || []).find(c => c.id === id) ||
                              (Object.values(this.lastData.folders || {}).flat().find(c => c.id === id));
                return { id, title: found?.title || 'Sin título', url: found?.url || '' };
            });
            const payload = {
                type: this.isBulkMode && this.selectedConvIds.has(conv.id) ? 'bulk' : 'single',
                ids: selectedIds,
                folder_from: folder || null,
                conversations: conversationsMeta
            };
            e.dataTransfer.setData('application/json', JSON.stringify(payload));
            li.classList.add('is-dragging');
        };
        li.ondragend = () => li.classList.remove('is-dragging');
        
        const tagsHtml = (conv.tags || []).map(tag => `<span class="badge tag">${tag}</span>`).join('');
        const foldersHtml = (conv.folders || []).map(f => {
            const hasEmoji = /\p{Emoji}/u.test(f.trim().substring(0, 2));
            return `
                <div class="badge-folder-container">
                    ${hasEmoji ? '' : '<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color mini-folder-icon">folder</mat-icon>'}
                    <span class="badge folder">${f}</span>
                </div>
            `;
        }).join('');

        this.setSafeHTML(li, `
            ${this.isBulkMode ? `<input type="checkbox" class="bulk-checkbox" ${this.selectedConvIds.has(conv.id) ? 'checked' : ''}>` : ''}
            <div class="conversation-item-content">
                <div class="conversation-main-row">
                    <span class="conversation-title" title="${conv.title}">${conv.title} <span class="conv-tags-inline">${tagsHtml}</span></span>
                    <button class="action-btn-mini edit-chat-title-btn" title="Renombrar chat">
                        ${this.svg.edit}
                    </button>
                </div>
                <div class="conversation-meta-row">
                    ${foldersHtml}
                    <button class="add-tag-btn" title="Añadir etiqueta">
                        ${this.svg.plus}
                    </button>
                    <button class="action-btn-mini delete-chat-btn" title="Eliminar del organizador">
                        ${this.svg.delete}
                    </button>
                </div>
            </div>
        `);

        li.onclick = (e) => {
            if (e.target.closest('.action-btn-mini') || e.target.closest('.add-tag-btn') || e.target.closest('.badge.tag')) return;
            if (window.geminiOrganizerAppInstance) {
                window.geminiOrganizerAppInstance.ui.openGeminiChat({ target: li });
            }
        };

        // Rename logic
        const editTitleBtn = li.querySelector('.edit-chat-title-btn');
        if (editTitleBtn) editTitleBtn.onclick = (e) => {
            e.stopPropagation();
            this.showEditChatPanel(conv, folder, editTitleBtn);
        };

        // Add tag logic
        const addTagBtn = li.querySelector('.add-tag-btn');
        if (addTagBtn) addTagBtn.onclick = (e) => {
            e.stopPropagation();
            this.showEditChatPanel(conv, folder, addTagBtn);
        };

        // Remove tag logic (click on tag)
        li.querySelectorAll('.badge.tag').forEach(tagEl => {
            tagEl.onclick = (e) => {
                e.stopPropagation();
                const tag = tagEl.textContent;
                if (e.altKey || e.ctrlKey) { // Option/Ctrl click to delete
                    this.showDeleteTagPanel(conv, folder, tag);
                } else { // Direct click to filter
                    this.searchTerm = tag;
                    const input = this.element.querySelector('#right-panel-search');
                    if (input) input.value = tag;
                    this.updateData();
                }
            };
        });

        const deleteChatBtn = li.querySelector('.delete-chat-btn');
        if (deleteChatBtn) deleteChatBtn.onclick = (e) => {
            e.stopPropagation();
            this.showDeleteChatPanel(conv, folder);
        };

        return li;
    }

    toggle(force) {
        if (!this.element) return;
        const panel = this.element.querySelector('#gemini-organizer-right-panel');
        if (!panel) {
            console.error("RightPanel: No se encontró el contenedor del panel para toggle");
            return;
        }
        
        const isCurrentlyHidden = panel.classList.contains('hidden');
        const newHiddenState = force !== undefined ? !force : !isCurrentlyHidden;
        
        panel.classList.toggle('hidden', newHiddenState);
        this.isOpen = !newHiddenState;
        
        const tab = this.element.querySelector('#gemini-organizer-right-panel-tab');
        if (tab) {
            const iconWrap = tab.querySelector('.handle-inner');
            if (iconWrap) {
                this.setSafeHTML(iconWrap, newHiddenState ? this.svg.chevronLeft : this.svg.chevronRight);
            }
        }
    }





    initResizers() {
        const root = this.element;
        const panel = this.getVisiblePanelElement();
        if (!root || !panel) return;

        const panelResizer = panel.querySelector('#right-panel-resizer');
        const dividerResizer = panel.querySelector('#right-panel-divider');
        const foldersContainer = panel.querySelector('#folders-main-container');

        // Horizontal Resizer (Panel Width)
        if (panelResizer) {
            panelResizer.onmousedown = (e) => {
                e.preventDefault();
                panelResizer.classList.add('is-resizing');
                const startX = e.clientX;
                const startWidth = panel.offsetWidth;

                const onMouseMove = (moveEvent) => {
                    const delta = startX - moveEvent.clientX; // Dragging left increases width
                    const newWidth = Math.min(Math.max(startWidth + delta, 300), 700);
                    panel.style.width = `${newWidth}px`;
                    this.settings.panelWidth = newWidth;
                };

                const onMouseUp = () => {
                    panelResizer.classList.remove('is-resizing');
                    this.settings.panelWidth = panel.offsetWidth;
                    this.saveSettings();
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };


                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        // Vertical Resizer (Folders Height)
        if (dividerResizer) {
            dividerResizer.onmousedown = (e) => {
                e.preventDefault();
                dividerResizer.classList.add('is-resizing');
                const startY = e.clientY;
                const startHeight = foldersContainer.offsetHeight;
                const parentHeight = foldersContainer.parentElement.offsetHeight;

                const onMouseMove = (moveEvent) => {
                    const delta = moveEvent.clientY - startY;
                    const newHeight = Math.min(Math.max(startHeight + delta, 100), parentHeight - 100);
                    const percentage = (newHeight / parentHeight) * 100;
                    foldersContainer.style.height = `${percentage}%`;
                    this.settings.foldersHeight = percentage;
                };

                const onMouseUp = () => {
                    dividerResizer.classList.remove('is-resizing');
                    this.settings.foldersHeight = parseFloat(foldersContainer.style.height);
                    this.saveSettings();
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }
    }

    updateBulkBar() {
        const bar = this.element.querySelector('#right-bulk-action-bar');
        const countSpan = this.element.querySelector('#bulk-selection-count');
        if (!bar || !countSpan) return;

        const count = this.selectedConvIds.size;
        bar.classList.toggle('hidden', !this.isBulkMode || count === 0);
        countSpan.textContent = `${count} seleccionados`;
    }

    async handleBulkMove() {
        const ids = Array.from(this.selectedConvIds);
        if (ids.length === 0) return;
        
        const allFolders = await window.geminiOrganizerAppInstance.storage.getFolders();
        
        this.showFolderPickerPanel(`Mover ${ids.length} chats a:`, async (folderName) => {
            const fm = window.geminiOrganizerAppInstance.folderManager;
            for (const id of ids) {
                await fm.addConversationToFolder(folderName, { id });
            }
            this.isBulkMode = false;
            this.selectedConvIds.clear();
            this.updateData();
            showToast(`${ids.length} chats movidos`, 'success');
        });
    }

    showFolderPickerPanel(title, onSelect) {
        const panel = document.createElement('div');
        panel.className = 'premium-edit-panel';
        
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>${title}</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <div class="folder-selection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-top: 10px;">
                    ${Object.keys(this.lastData.folders).map(f => `<button class="folder-option-btn">${f}</button>`).join('')}
                </div>
            </div>
        `);
        
        document.body.appendChild(panel);
        this.centerPanel(panel);
        
        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();
        panel.querySelectorAll('.folder-option-btn').forEach(btn => {
            btn.onclick = () => {
                onSelect(btn.textContent);
                panel.remove();
            };
        });
    }

    async handleBulkDelete() {
        const ids = Array.from(this.selectedConvIds);
        if (ids.length === 0) return;

        await this.showConfirmPanel(`¿Eliminar ${ids.length} chats del organizador?`, async () => {
            const fm = window.geminiOrganizerAppInstance.folderManager;

            if (this.currentFolderView) {
                for (const id of ids) {
                    await fm.removeConversationFromFolder(this.currentFolderView, id);
                }
            } else {
                const allFolders = await window.geminiOrganizerAppInstance.storage.getFolders();
                for (const id of ids) {
                    for (const folderName in allFolders) {
                        await fm.removeConversationFromFolder(folderName, id);
                    }
                }
            }

            this.isBulkMode = false;
            this.selectedConvIds.clear();
            this.updateData();
            showToast(`${ids.length} chats eliminados`, 'success');
        });
    }

    async handleBulkRemove() {
        const ids = Array.from(this.selectedConvIds);
        if (ids.length === 0) return;

        await this.showConfirmPanel(`¿Quitar ${ids.length} chats de sus carpetas actuales?`, async () => {
            const fm = window.geminiOrganizerAppInstance.folderManager;
            const allFolders = await window.geminiOrganizerAppInstance.storage.getFolders();

            for (const id of ids) {
                for (const folderName in allFolders) {
                    await fm.removeConversationFromFolder(folderName, id);
                }
            }

            this.isBulkMode = false;
            this.selectedConvIds.clear();
            this.updateData();
            showToast('Chats movidos a "No Ordenados"', 'success');
        });
    }

    showConfirmPanel(message, onConfirm) {
        return new Promise((resolve) => {
            const panel = document.createElement('div');
            panel.className = 'premium-edit-panel confirm-panel';
            this.setSafeHTML(panel, `
                <div class="edit-panel-body">
                    <p class="confirm-message">${message}</p>
                    <div class="edit-actions">
                        <button class="cancel-btn">Cancelar</button>
                        <button class="confirm-btn danger">Confirmar</button>
                    </div>
                </div>
            `);
            document.body.appendChild(panel);
            this.centerPanel(panel);
            
            panel.querySelector('.cancel-btn').onclick = () => {
                panel.remove();
                resolve(false);
            };
            panel.querySelector('.confirm-btn').onclick = async () => {
                try {
                    await onConfirm();
                    resolve(true);
                } finally {
                    panel.remove();
                }
            };
        });
    }

    async loadSettings() {
        if (!window.geminiOrganizerAppInstance) return;
        
        // 1. Load Local Settings (Fast)
        try {
            this.settings = await window.geminiOrganizerAppInstance.storage.getSettings();
        } catch (e) {
            console.error("RightPanel: Error loading settings", e);
        }
        
        // 2. Apply Visuals as soon as possible
        this.applySettings();

        // 3. User Identity (Async / Non-blocking)
        // We don't await this to prevent identity service hangups from blocking the UI
        this.auth.getUserInfo().then(user => {
            this.user = user;
            console.log("RightPanel: Identidad de usuario cargada asíncronamente");
        }).catch(err => {
            console.warn("RightPanel: Fallo al cargar identidad (no crítico)", err);
        });
    }


    applySettings() {
        if (!this.element) return;
        const panel = this.getVisiblePanelElement();
        
        // 1. Density (Forced compact now)
        this.element.classList.add('density-compact');
        
        // 2. Dimensions
        const width = this.settings.panelWidth || 340;
        if (panel) {
            panel.style.width = `${width}px`;
        }
        
        const foldersContainer = panel?.querySelector('#folders-main-container') || this.element.querySelector('#folders-main-container');
        if (foldersContainer) {
            const height = this.settings.foldersHeight || 40;
            foldersContainer.style.height = `${height}%`;
        }
    }

    async saveSettings() {
        if (!window.geminiOrganizerAppInstance) return;
        await window.geminiOrganizerAppInstance.storage.saveSettings(this.settings);
    }

    showSettingsMenu() {
        const existing = document.querySelector('.settings-menu-overlay');
        if (existing) {
            existing.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'settings-menu-overlay';
        
        const userHtml = this.user ? `
            <div class="settings-user-profile">
                <img src="${this.user.avatar}" class="user-avatar" />
                <div class="user-info">
                    <span class="user-name">Conectado</span>
                    <span class="user-email">${this.user.email}</span>
                </div>
            </div>
            <div class="premium-badge-row">
                <span class="premium-status">Sincronización Activa</span>
            </div>
            <div class="premium-dropdown-menu .menu-divider" style="margin: 0 0 8px 0;"></div>
        ` : `
            <div class="settings-user-profile anonymous">
                <div class="user-avatar guest">${this.svg.lock || '?'}</div>
                <div class="user-info">
                    <span class="user-name">Modo Local</span>
                    <span class="user-email">Inicia sesión en Chrome</span>
                </div>
            </div>
             <div class="premium-dropdown-menu .menu-divider" style="margin: 0 0 8px 0;"></div>
        `;

        this.setSafeHTML(menu, `
            ${userHtml}
            <div class="settings-title-label">SISTEMA</div>
            <div class="settings-option" id="opt-backup">
                <span class="settings-label">Exportar/Importar (.json)</span>
                ${this.svg.chevronRight}
            </div>
             <div class="settings-title-label" style="margin-top: 8px;">APARIENCIA</div>
            <div class="settings-option">
                <span class="settings-label">Modo Compacto (forzado, sin opción de cambio)</span>
            </div>
        `);


        document.body.appendChild(menu);

        // Position under settings button
        const btn = this.element.querySelector('#right-settings-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.left = `${rect.right - 220}px`;

        // Events
        menu.querySelector('#opt-backup').onclick = () => {
             menu.remove();
             this.showDataManagementPanel();
        };

        // Close on click outside
        const close = (e) => {
            if (!menu.contains(e.target) && e.target.id !== 'right-settings-btn' && !e.target.closest('#right-settings-btn')) {
                menu.remove();
                document.removeEventListener('mousedown', close);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
    }

    showEditChatPanel(conv, folder, triggerElement = null) {
        const panel = document.createElement('div');
        panel.id = 'folder-edit-panel';
        panel.className = 'premium-edit-panel';
        
        const currentTags = (conv.tags || []).join(', ');
        
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>Editar Chat</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <div class="edit-row">
                    <label style="font-size: 11px; color: var(--rp-text-secondary); margin-bottom: 4px; display: block;">TÍTULO</label>
                    <input type="text" id="edit-chat-title" placeholder="Título del chat" value="${conv.title}">
                </div>
                <div class="edit-row" style="margin-top: 12px;">
                    <label style="font-size: 11px; color: var(--rp-text-secondary); margin-bottom: 4px; display: block;">ETIQUETAS (separadas por coma)</label>
                    <input type="text" id="edit-chat-tags" placeholder="ej: trabajo, ideas, personal" value="${currentTags}">
                </div>
                <div class="edit-actions" style="margin-top: 24px; display: flex; gap: 12px; align-items: center;">
                    <button class="delete-btn danger-text" style="background: none; border: none; color: #f28b82; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 8px 0;">
                        ${this.svg.delete} Eliminar Chat
                    </button>
                    <div style="flex: 1"></div>
                    <button class="save-btn primary" style="background: #a8c7fa; color: #062e6f; border: none; padding: 10px 24px; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                        Guardar
                    </button>
                </div>
            </div>
        `);
        document.body.appendChild(panel);
        
        // Dynamic Positioning
        if (triggerElement) {
            const rect = triggerElement.getBoundingClientRect();
            const panelWidth = 280;
            const rightPanelRect = this.getVisiblePanelElement().getBoundingClientRect();
            
            let top = rect.top;
            if (top + 250 > window.innerHeight) top = window.innerHeight - 260;
            
            panel.style.top = `${top}px`;
            panel.style.left = `${rightPanelRect.left + (rightPanelRect.width - panelWidth) / 2}px`;
        } else {
            this.centerPanel(panel);
        }
        
        const inputTitle = panel.querySelector('#edit-chat-title');
        const inputTags = panel.querySelector('#edit-chat-tags');
        inputTitle.focus();

        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();
        
        const save = async () => {
            const newTitle = inputTitle.value.trim();
            const tagsString = inputTags.value.trim();
            
            if (window.geminiOrganizerAppInstance) {
                const fm = window.geminiOrganizerAppInstance.folderManager;
                const ga = window.geminiOrganizerAppInstance.geminiAdapter;
                const newTags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
                
                await fm.updateConversationMetadata(folder, conv.id, newTitle, newTags);
                
                // Native Sync (Point 4): Tags at the end of title
                const tagsSuffix = newTags.length > 0 ? ` [${newTags.join(', ')}]` : '';
                const fullTitle = `${newTitle}${tagsSuffix}`;
                if (ga) await ga.renameConversationNative(conv.id, fullTitle);
                
                this.updateData();
                panel.remove();
            }
        };

        panel.querySelector('.save-btn').onclick = save;
        inputTitle.onkeydown = (e) => e.key === 'Enter' && save();
        
        panel.querySelector('.delete-btn').onclick = () => {
            panel.remove();
            this.showDeleteChatPanel(conv, folder);
        };
    }

    showDeleteChatPanel(conv, folder) {
        const panel = document.createElement('div');
        panel.id = 'folder-edit-panel';
        panel.className = 'premium-edit-panel';
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>Eliminar Conversación</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <p style="color: var(--rp-text-secondary); margin-bottom: 20px;">
                    ¿Seguro que quieres eliminar "${conv.title}" de esta carpeta?
                </p>
                <div class="edit-actions">
                    <button class="delete-btn danger">Confirmar Borrado</button>
                    <div style="flex: 1"></div>
                    <button class="save-btn secondary">Cancelar</button>
                </div>
            </div>
        `);
        document.body.appendChild(panel);
        this.centerPanel(panel);

        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();
        panel.querySelector('.save-btn.secondary').onclick = () => panel.remove();
        panel.querySelector('.delete-btn').onclick = async () => {
            if (window.geminiOrganizerAppInstance) {
                await window.geminiOrganizerAppInstance.folderManager.deleteConversation(folder, conv.id);
                this.updateData();
                panel.remove();
            }
        };
    }

    showDeleteTagPanel(conv, folder, tag) {
        const panel = document.createElement('div');
        panel.id = 'folder-edit-panel';
        panel.className = 'premium-edit-panel';
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>Eliminar Etiqueta</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <p style="color: var(--rp-text-secondary); margin-bottom: 20px;">
                    ¿Seguro que quieres quitar la etiqueta <strong>#${tag}</strong> de este chat?
                </p>
                <div class="edit-actions">
                    <button class="delete-btn danger">Quitar Etiqueta</button>
                    <div style="flex: 1"></div>
                    <button class="save-btn secondary">Cancelar</button>
                </div>
            </div>
        `);
        document.body.appendChild(panel);
        this.centerPanel(panel);
        panel.querySelector('.delete-btn').onclick = async () => {
            if (window.geminiOrganizerAppInstance) {
                await window.geminiOrganizerAppInstance.folderManager.removeTagFromConversation(folder, conv.id, tag);
                this.updateData();
                panel.remove();
            }
        };
        panel.querySelector('.save-btn').onclick = () => panel.remove();
        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();
    }

    showDataManagementPanel() {
        const panel = document.createElement('div');
        panel.id = 'folder-edit-panel';
        panel.className = 'premium-edit-panel';
        this.setSafeHTML(panel, `
            <div class="edit-panel-header">
                <h3>Gestión de Datos</h3>
                <button class="close-panel-btn">${this.svg.close}</button>
            </div>
            <div class="edit-panel-body">
                <div class="data-actions-row" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    <button class="data-box-btn" id="data-export-btn" style="padding: 16px; background: rgba(168, 199, 250, 0.05); border: 1px solid rgba(168, 199, 250, 0.1); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;">
                        <span style="font-size: 24px;">📤</span>
                        <div style="flex: 1">
                            <div style="font-weight: 500; color: #a8c7fa;">Exportar JSON</div>
                            <div style="font-size: 12px; color: var(--rp-text-secondary);">Descarga un respaldo de tus carpetas</div>
                        </div>
                    </button>
                    <button class="data-box-btn" id="data-import-btn" style="padding: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;">
                        <span style="font-size: 24px;">📥</span>
                        <div style="flex: 1">
                            <div style="font-weight: 500; color: var(--rp-text-primary);">Importar JSON</div>
                            <div style="font-size: 12px; color: var(--rp-text-secondary);">Restaura datos desde un archivo .json</div>
                        </div>
                    </button>
                </div>
            </div>
        `);
        document.body.appendChild(panel);
        this.centerPanel(panel);

        panel.querySelector('.close-panel-btn').onclick = () => panel.remove();
        
        // Use more robust access to folderManager
        const getFM = () => window.geminiOrganizerAppInstance?.folderManager;

        panel.querySelector('#data-export-btn').onclick = () => {
            const fm = getFM();
            if (fm) fm.exportBackup();
            panel.remove();
        };
        panel.querySelector('#data-import-btn').onclick = () => {
            const fm = getFM();
            if (fm) fm.importBackup();
            panel.remove();
        };
    }

    updateTagsBar(data) {
        const bar = this.element.querySelector('#right-tags-bar');
        if (!bar) return;
        
        // Extract tags based on view
        let tagsSet = new Set();
        if (this.currentFolderView && data.folders[this.currentFolderView]) {
            data.folders[this.currentFolderView].forEach(c => (c.tags || []).forEach(t => tagsSet.add(t)));
        } else {
            // Global view
            data.conversations.forEach(c => (c.tags || []).forEach(t => tagsSet.add(t)));
        }
        
        const tags = Array.from(tagsSet).sort();
        if (tags.length === 0) {
            this.setSafeHTML(bar, '');
            return;
        }

        this.setSafeHTML(bar, tags.map(tag => `<span class="tag-chip" data-tag="${tag}">${tag}</span>`).join(''));
        
        bar.querySelectorAll('.tag-chip').forEach(chip => {
            chip.onclick = () => {
                const searchInput = this.element.querySelector('#right-panel-search');
                if (searchInput) {
                    searchInput.value = chip.dataset.tag;
                    this.searchTerm = chip.dataset.tag.toLowerCase();
                    this.updateData();
                }
            };
        });
    }

    centerPanel(panel) {
        const rightPanelRect = this.getVisiblePanelElement().getBoundingClientRect();
        const l = rightPanelRect.left + (rightPanelRect.width - 280) / 2;
        panel.style.top = `150px`;
        panel.style.left = `${Math.max(10, l)}px`;
    }
}
