import Component from '../core/Component.js';
import AuthService from '../services/AuthService.js';
import { showToast } from '../utils.js';

export default class RightPanel extends Component {
    constructor(props = {}) {
        super({ ...props, useShadow: false, id: 'gemini-organizer-right-panel' });
        this.isOpen = false;
        this.currentFolderView = null;
        this.isBulkMode = false;
        this.selectedConvIds = new Set();
        this.settings = { density: 'standard', panelWidth: 340, foldersHeight: 38 };
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
            settings: `<svg viewBox="0 0 24 24" ${s}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
        };




        // Bind methods
        this.toggle = this.toggle.bind(this);
        this.dragAndDropHandler = null;
    }

    setDragAndDropHandler(handler) {
        this.dragAndDropHandler = handler;
    }






    render() {
        return `
            <div id="gemini-organizer-right-panel" class="hidden">
                <div class="right-panel-resizer" id="right-panel-resizer"></div>
                
                <div class="panel-container">
                    <!-- Header with Home & Search -->
                    <div class="right-panel-header">
                        <button class="header-btn" id="right-back-btn" title="Volver al inicio">
                            ${this.svg.home}
                        </button>
                        <div class="header-search-container">
                            <span class="mini-search-icon">${this.svg.search}</span>
                            <input type="search" id="right-panel-search" placeholder="Buscar conversaciones...">
                        </div>
                        <div class="header-actions">
                            <button class="header-btn" id="right-settings-btn" title="Configuración">
                                ${this.svg.settings}
                            </button>
                            <button class="header-btn" id="close-right-panel" title="Cerrar panel">
                                ${this.svg.chevronRight}
                            </button>
                        </div>
                    </div>



                    <div class="panel-content" id="right-panel-content-area">
                        <!-- CARPETAS SECTION -->
                        <div class="section-group" id="folders-main-container">
                            <div class="section-header-row">
                                <h2 class="section-title">Carpetas <span class="inline-add" id="right-add-folder-btn" title="Nueva Carpeta">+</span></h2>
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
                            <button class="bulk-move-btn">Mover a...</button>
                            <button class="bulk-delete-btn danger">Borrar</button>
                        </div>
                    </div>
                </div>


                <!-- Floating Toggle Handle -->
                <div id="gemini-organizer-right-panel-tab" class="drawer-handle">
                    <div class="handle-inner" id="drawer-handle-icon">
                        ${this.svg.chevronLeft}
                    </div>
                </div>



            </div>
        `;
    }

    getStyles() {
        return ''; // Styles are in right-panel.css
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
            grid.innerHTML = '';
            
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
            list.innerHTML = '';
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

            // Show/Hide New Chat in Folder button
            const newChatBtn = this.element.querySelector('#right-new-chat-folder-btn');
            if (newChatBtn) {
                newChatBtn.style.display = (this.currentFolderView && this.currentFolderView !== 'Sin Organizar') ? 'flex' : 'none';
                newChatBtn.onclick = () => {
                    if (window.geminiOrganizerAppInstance) {
                        window.geminiOrganizerAppInstance.folderManager.setPendingFolderForNewChat(this.currentFolderView);
                    }
                };
            }

            
            if (displayConvs.length === 0) {
                list.innerHTML = `<li class="empty-msg">${this.searchTerm ? 'No se encontraron resultados.' : 'Sin chats guardados.'}</li>`;
            } else {
                displayConvs.forEach(conv => {
                    list.appendChild(this.renderConversationItem(conv));
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
        container.innerHTML = tags.map(tag => `
            <span class="tag-chip ${this.searchTerm === tag.name ? 'active' : ''}" data-tag="${tag.name}">
                #${tag.name} <span class="tag-count">${tag.count}</span>
            </span>
        `).join('');

        container.querySelectorAll('.tag-chip').forEach(chip => {
            chip.onclick = () => {
                const tag = chip.dataset.tag;
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



        // Extract emoji if present
        const emojiMatch = folderName.match(/^(\p{Emoji})/u);
        const emoji = emojiMatch ? emojiMatch[1] : null;
        const displayName = emoji ? folderName.replace(emoji, '').trim() : folderName;

        div.innerHTML = `
            <div class="folder-icon-wrapper">
                ${isVirtual ? `<span class="folder-emoji-large">⚡</span>` : (emoji ? `<span class="folder-emoji-large">${emoji}</span>` : `
                <span class="folder-emoji-large">📂</span>
                `)}
            </div>
            <div class="folder-label-wrapper">
                <span class="folder-name">${displayName}</span>
                <span class="folder-count">(${count})</span>
            </div>
            ${isVirtual ? '' : `
            <button class="folder-menu-trigger" title="Opciones">
                ${this.svg.moreVert}
            </button>
            `}
        `;
        
        const trigger = div.querySelector('.folder-menu-trigger');
        if (trigger) trigger.onclick = (e) => {
            e.stopPropagation();
            this.showFolderActionMenu(folderName, emoji, displayName, e);
        };

        
        div.onclick = (e) => {
            if (e.target.closest('.card-action-btn')) return;
            this.currentFolderView = folderName;
            this.updateData();
        };

        return div;
    }


    showFolderActionMenu(folderName, emoji, displayName, event) {
        // Remove existing menu if any
        const existing = document.querySelector('#folder-action-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'folder-action-menu';
        menu.className = 'premium-dropdown-menu';
        
        menu.innerHTML = `
            <div class="menu-item emoji-opt">
                <span class="menu-icon">${this.svg.mood}</span>
                <span>Cambiar Emoji</span>
            </div>
            <div class="menu-item edit-opt">
                <span class="menu-icon">${this.svg.edit}</span>
                <span>Renombrar</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item delete-opt danger">
                <span class="menu-icon">${this.svg.delete}</span>
                <span>Eliminar</span>
            </div>
        `;

        // Position it
        const rect = event.currentTarget.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left - 120}px`; // Shift left to align and fit
        
        document.body.appendChild(menu);

        // Events
        menu.querySelector('.emoji-opt').onclick = (e) => {
            e.stopPropagation();
            const newEmoji = prompt('Elige un emoji:', emoji || '');
            if (newEmoji !== null) {
                const pureName = folderName.replace(/^(\p{Emoji})/u, '').trim();
                const newFolderName = newEmoji ? `${newEmoji} ${pureName}` : pureName;
                window.geminiOrganizerAppInstance.folderManager.renameFolder(folderName, newFolderName);
            }
            menu.remove();
        };

        menu.querySelector('.edit-opt').onclick = (e) => {
            e.stopPropagation();
            const newName = prompt('Nuevo nombre:', displayName);
            if (newName && newName !== displayName) {
                const finalName = emoji ? `${emoji} ${newName}` : newName;
                window.geminiOrganizerAppInstance.folderManager.renameFolder(folderName, finalName);
            }
            menu.remove();
        };

        menu.querySelector('.delete-opt').onclick = (e) => {
            e.stopPropagation();
            if (confirm(`¿Eliminar "${folderName}"?`)) {
                window.geminiOrganizerAppInstance.folderManager.deleteFolder(folderName);
                if (this.currentFolderView === folderName) this.currentFolderView = null;
            }
            menu.remove();
        };

        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeMenu), 0);
    }


    renderConversationItem(conv) {
        const li = document.createElement('li');
        li.className = 'conversation-item';
        if (this.isBulkMode) li.classList.add('bulk-mode');
        if (this.selectedConvIds.has(conv.id)) li.classList.add('selected');
        li.dataset.convId = conv.id;
        
        const tagsHtml = (conv.tags || []).map(t => `<span class="badge tag" data-tag="${t}">#${t}</span>`).join('');
        const foldersHtml = (conv.folders || []).map(f => {
            const hasEmoji = /\p{Emoji}/u.test(f.trim().substring(0, 2));
            return `
                <div class="badge-folder-container">
                    ${hasEmoji ? '' : '<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color mini-folder-icon">folder</mat-icon>'}
                    <span class="badge folder">${f}</span>
                </div>
            `;
        }).join('');

        li.innerHTML = `
            ${this.isBulkMode ? `<input type="checkbox" class="bulk-checkbox" ${this.selectedConvIds.has(conv.id) ? 'checked' : ''}>` : ''}
            <div class="conversation-item-content">
                <div class="conversation-main-row">
                    <span class="conversation-title" title="${conv.title}">${conv.title}</span>

                    <button class="action-btn-mini edit-chat-title-btn" title="Renombrar chat">
                        ${this.svg.edit}
                    </button>
                </div>
                <div class="conversation-meta-row">
                    ${foldersHtml}
                    <div class="tags-container">
                        ${tagsHtml}
                        <button class="add-tag-btn" title="Añadir etiqueta">
                            ${this.svg.plus}
                        </button>
                    </div>
                    <button class="action-btn-mini delete-chat-btn" title="Eliminar del organizador">
                        ${this.svg.delete}
                    </button>
                </div>
            </div>
        `;

        li.onclick = (e) => {
            if (e.target.closest('.action-btn-mini') || e.target.closest('.add-tag-btn') || e.target.closest('.badge.tag')) return;
            if (window.geminiOrganizerAppInstance) {
                window.geminiOrganizerAppInstance.ui.openGeminiChat({ target: li });
            }
        };

        const folder = this.currentFolderView || (conv.folders && conv.folders[0]);

        // Rename logic
        const editTitleBtn = li.querySelector('.edit-chat-title-btn');
        if (editTitleBtn) editTitleBtn.onclick = (e) => {
            e.stopPropagation();
            const newTitle = prompt('Nuevo título para la conversación:', conv.title);
            if (newTitle && newTitle !== conv.title && window.geminiOrganizerAppInstance) {
                window.geminiOrganizerAppInstance.folderManager.renameConversation(folder, conv.id, newTitle);
            }
        };

        // Add tag logic
        const addTagBtn = li.querySelector('.add-tag-btn');
        if (addTagBtn) addTagBtn.onclick = (e) => {
            e.stopPropagation();
            const tag = prompt('Nueva etiqueta (ej: trabajo, ideas):');
            if (tag && window.geminiOrganizerAppInstance) {
                window.geminiOrganizerAppInstance.folderManager.addTagToConversation(folder, conv.id, tag);
            }
        };

        // Remove tag logic (click on tag)
        li.querySelectorAll('.badge.tag').forEach(tagEl => {
            tagEl.onclick = (e) => {
                e.stopPropagation();
                const tag = tagEl.dataset.tag;
                if (e.altKey || e.ctrlKey) { // Option/Ctrl click to delete
                    if (confirm(`¿Eliminar etiqueta #${tag}?`)) {
                        if (window.geminiOrganizerAppInstance) {
                            window.geminiOrganizerAppInstance.folderManager.removeTagFromConversation(folder, conv.id, tag);
                        }
                    }
                } else { // Direct click to filter
                    this.searchTerm = tag;
                    const input = this.element.querySelector('#right-panel-search');
                    if (input) input.value = tag;
                    this.updateData();
                }
            };
        });


        const delBtn = li.querySelector('.delete-chat-btn');
        if (delBtn) delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar esta conversación de la carpeta?')) {
                if (folder && window.geminiOrganizerAppInstance) {
                    window.geminiOrganizerAppInstance.folderManager.deleteConversation(folder, conv.id);
                }
            }
        };

        return li;
    }

    toggle(force) {
        if (!this.element) return;
        
        const isCurrentlyHidden = this.element.classList.contains('hidden');
        const newHiddenState = force !== undefined ? !force : !isCurrentlyHidden;
        
        this.element.classList.toggle('hidden', newHiddenState);
        this.isOpen = !newHiddenState;
        
        const tab = this.element.querySelector('#gemini-organizer-right-panel-tab');
        if (tab) {
            const iconWrap = tab.querySelector('.handle-inner');
            if (iconWrap) {
                iconWrap.innerHTML = newHiddenState ? this.svg.chevronLeft : this.svg.chevronRight;
            }
        }
    }

    afterRender() {
        if (!this.element) return;
        
        const backBtn = this.element.querySelector('#right-back-btn');
        if (backBtn) backBtn.onclick = () => {
            if (this.currentFolderView) {
                this.currentFolderView = null;
                this.updateData();
            } else {
                // If already at Home, maybe just refresh?
                this.updateData();
            }
        };

        const drawerHandle = this.element.querySelector('.drawer-handle');
        if (drawerHandle) drawerHandle.onclick = () => this.toggle();
        
        const closeBtn = this.element.querySelector('#close-right-panel');
        if (closeBtn) closeBtn.onclick = () => this.toggle(false);

        const settingsBtn = this.element.querySelector('#right-settings-btn');
        if (settingsBtn) settingsBtn.onclick = (e) => {
            e.stopPropagation();
            this.showSettingsMenu();
        };

        const searchInput = this.element.querySelector('#right-panel-search');

        if (searchInput) {
            searchInput.oninput = (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.updateData();
            };
        }

        const bulkToggleBtn = this.element.querySelector('#right-bulk-toggle');
        if (bulkToggleBtn) {
            bulkToggleBtn.classList.toggle('active', this.isBulkMode);
            bulkToggleBtn.onclick = () => {
                this.isBulkMode = !this.isBulkMode;
                if (!this.isBulkMode) this.selectedConvIds.clear();
                this.updateData();
                this.updateBulkBar();
            };
        }

        // Checkbox events
        this.element.querySelectorAll('.bulk-checkbox').forEach(cb => {
            cb.onchange = (e) => {
                const li = cb.closest('.conversation-item');
                const id = li.dataset.convId;
                if (cb.checked) {
                    this.selectedConvIds.add(id);
                    li.classList.add('selected');
                } else {
                    this.selectedConvIds.delete(id);
                    li.classList.remove('selected');
                }
                this.updateBulkBar();
            };
        });

        // Bulk Actions
        const bulkBar = this.element.querySelector('#right-bulk-action-bar');
        if (bulkBar) {
            bulkBar.querySelector('.bulk-move-btn').onclick = () => this.handleBulkMove();
            bulkBar.querySelector('.bulk-delete-btn').onclick = () => this.handleBulkDelete();
        }

        this.initResizers();

        
        // Drag and Drop Listeners for Folder Cards
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


    initResizers() {
        const root = this.element;
        const panelResizer = root.querySelector('#right-panel-resizer');
        const dividerResizer = root.querySelector('#right-panel-divider');
        const foldersContainer = root.querySelector('#folders-main-container');

        // Horizontal Resizer (Panel Width)
        if (panelResizer) {
            panelResizer.onmousedown = (e) => {
                e.preventDefault();
                panelResizer.classList.add('is-resizing');
                const startX = e.clientX;
                const startWidth = root.offsetWidth;

                const onMouseMove = (moveEvent) => {
                    const delta = startX - moveEvent.clientX; // Dragging left increases width
                    const newWidth = Math.min(Math.max(startWidth + delta, 300), 700);
                    root.style.width = `${newWidth}px`;
                };

                const onMouseUp = () => {
                    panelResizer.classList.remove('is-resizing');
                    this.settings.panelWidth = root.offsetWidth;
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
        if (this.selectedConvIds.size === 0) return;
        const folders = Object.keys(this.lastData.folders);
        if (folders.length === 0) return;

        const target = prompt(`Mover ${this.selectedConvIds.size} chats a:\n${folders.join(', ')}`);
        if (target && folders.includes(target) && window.geminiOrganizerAppInstance) {
            await window.geminiOrganizerAppInstance.folderManager.moveConversationsToFolder(
                Array.from(this.selectedConvIds), 
                this.currentFolderView || 'Recientes',
                target
            );
            this.isBulkMode = false;
            this.selectedConvIds.clear();
            this.updateData();
        }
    }

    async handleBulkDelete() {
        if (this.selectedConvIds.size === 0) return;
        if (confirm(`¿Eliminar ${this.selectedConvIds.size} chats de esta carpeta?`)) {
            if (window.geminiOrganizerAppInstance) {
                await window.geminiOrganizerAppInstance.folderManager.deleteMultipleConversations(
                    this.currentFolderView || 'Recientes',
                    Array.from(this.selectedConvIds)
                );
                this.isBulkMode = false;
                this.selectedConvIds.clear();
                this.updateData();
            }
        }
    }

    async loadSettings() {
        if (!window.geminiOrganizerAppInstance) return;
        this.settings = await window.geminiOrganizerAppInstance.storage.getSettings();
        this.user = await this.auth.getUserInfo();
        this.applySettings();
    }


    applySettings() {
        if (!this.element) return;
        
        // 1. Density
        this.element.classList.toggle('density-compact', this.settings.density === 'compact');
        
        // 2. Dimensions
        this.element.style.width = `${this.settings.panelWidth}px`;
        const foldersContainer = this.element.querySelector('#folders-main-container');
        if (foldersContainer) {
            foldersContainer.style.height = `${this.settings.settings?.foldersHeight || 38}%`;
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

        menu.innerHTML = `
            ${userHtml}
            <div class="settings-title-label">APARIENCIA</div>
            <div class="settings-option" id="opt-density">
                <span class="settings-label">Modo Compacto</span>
                <div class="settings-toggle ${this.settings.density === 'compact' ? 'active' : ''}"></div>
            </div>
            <div class="settings-title-label" style="margin-top: 8px;">SERVICIO</div>
            <div class="settings-option" id="opt-backup">
                <span class="settings-label">Crear Respaldo</span>
                ${this.svg.chevronRight}
            </div>
             <div class="settings-option" id="opt-restore">
                <span class="settings-label">Restaurar</span>
                ${this.svg.chevronRight}
            </div>
        `;


        document.body.appendChild(menu);

        // Position under settings button
        const btn = this.element.querySelector('#right-settings-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.left = `${rect.right - 220}px`;

        // Events
        menu.querySelector('#opt-density').onclick = () => {
            this.settings.density = this.settings.density === 'compact' ? 'standard' : 'compact';
            this.applySettings();
            this.saveSettings();
            menu.querySelector('.settings-toggle').classList.toggle('active', this.settings.density === 'compact');
        };

        menu.querySelector('#opt-backup').onclick = () => {
             window.geminiOrganizerAppInstance.folderManager.exportBackup(); 
             menu.remove();
        };

        menu.querySelector('#opt-restore').onclick = () => {
             window.geminiOrganizerAppInstance.folderManager.importBackup();
             menu.remove();
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
}


