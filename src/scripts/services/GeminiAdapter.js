/**
 * Service responsible for all interactions with the underlying Gemini DOM.
 * Centralizes CSS selectors and DOM traversal logic to make the extension
 * more resilient to changes in Google's UI.
 */
export default class GeminiAdapter {
    constructor() {
        this.selectors = {
            myStuffButton: 'side-nav-entry-button[data-test-id="my-stuff-side-nav-entry-button"]',
            newChatButton: 'side-nav-action-button[data-test-id="new-chat-button"]',
            newChatLink: 'a[aria-label="Nuevo chat"]',
            chatHistoryList: '.chat-history-list',
            moreOptionsButton: '.conversation-actions-menu-button',
            renameInput: 'input[aria-label="Cambiar nombre del chat"]',
            sidebarContainer: 'mat-sidenav-container', 
            mainContent: 'main',
        };
    }

    /**
     * Finds the best element to insert the Organizer button relative to.
     * Prioritizes "My Stuff", then "New Chat", then the chat history list.
     * @returns {{ element: HTMLElement, position: 'before' | 'after' } | null}
     */
    getSidebarInsertionPoint() {
        const myStuff = document.querySelector(this.selectors.myStuffButton);
        if (myStuff) return { element: myStuff, position: 'before' };

        const newChat = document.querySelector(this.selectors.newChatButton);
        if (newChat) return { element: newChat, position: 'after' };

        const historyList = document.querySelector(this.selectors.chatHistoryList);
        if (historyList) return { element: historyList, position: 'before' };

        // Ultimate fallback: first nav
        const nav = document.querySelector('nav');
        if (nav) return { element: nav, position: 'after' };

        return null;
    }

    /**
     * Scrapes the current sidebar for visible conversations.
     * @returns {Array<{id: string, title: string, url: string}>}
     */
    getVisibleChats() {
        const list = document.querySelector(this.selectors.chatHistoryList);
        if (!list) return [];
        
        // Gemini conversations usually have this data attribute
        const items = list.querySelectorAll('div[data-test-id="conversation"]');
        return Array.from(items).map(item => {
            const titleEl = item.querySelector('.conversation-title');
            
            // Extracting ID from JSLog is the most stable method
            const jslog = item.getAttribute('jslog');
            const match = jslog ? jslog.match(/["']c_([^"']+)["']/) : null;
            const id = match ? match[1] : null;
            
            return {
                id,
                title: titleEl ? titleEl.textContent.trim() : 'Sin título',
                url: id ? `https://gemini.google.com/app/${id}` : window.location.href
            };
        }).filter(c => c.id);
    }

    /**
     * Attempts to update the title of a conversation in the native Gemini sidebar.
     * @param {string} id - The conversation ID.
     * @param {string} newTitle - The new title to display.
     * @returns {boolean} - True if the element was found and updated.
     */
    updateNativeChatTitle(id, newTitle) {
        if (!id) return false;
        const list = document.querySelector(this.selectors.chatHistoryList);
        if (!list) return false;

        const items = list.querySelectorAll('div[data-test-id="conversation"]');
        for (const item of items) {
            const jslog = item.getAttribute('jslog');
            // Match the c_ID pattern in jslog
            if (jslog && (jslog.includes(`"c_${id}"`) || jslog.includes(`'c_${id}'`))) {
                const titleEl = item.querySelector('.conversation-title');
                if (titleEl) {
                    titleEl.textContent = newTitle;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Triggers the native Gemini rename flow for a conversation.
     * @param {string} id - Conversation ID.
     * @param {string} newTitleWithTags - The new title including tags.
     */
    async renameConversationNative(id, newTitleWithTags) {
        if (!id) return;
        
        // 1. Find the more options button for this specific chat
        const list = document.querySelector(this.selectors.chatHistoryList);
        if (!list) return;

        const items = list.querySelectorAll('div[data-test-id="conversation"]');
        let targetItem = null;
        for (const item of items) {
            const jslog = item.getAttribute('jslog');
            if (jslog && (jslog.includes(`"c_${id}"`) || jslog.includes(`'c_${id}'`))) {
                targetItem = item;
                break;
            }
        }

        if (!targetItem) return;

        // 2. Click more options
        const moreBtn = targetItem.querySelector(this.selectors.moreOptionsButton);
        if (moreBtn) {
            moreBtn.click();
            
            // 3. Wait for menu and click "Rename" (Cambiar nombre)
            await new Promise(r => setTimeout(r, 100));
            const menuItems = document.querySelectorAll('button[role="menuitem"]');
            const renameBtn = Array.from(menuItems).find(i => i.textContent.includes('nombre'));
            
            if (renameBtn) {
                renameBtn.click();
                
                // 4. Wait for modal, type new name and press Enter
                await new Promise(r => setTimeout(r, 200));
                const input = document.querySelector(this.selectors.renameInput);
                if (input) {
                    input.value = newTitleWithTags;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    
                    // Sometimes need a click on the primary button too
                    const confirmBtn = document.querySelector('button.mat-primary');
                    if (confirmBtn && confirmBtn.textContent.includes('nombre')) {
                        confirmBtn.click();
                    }
                }
            }
        }
    }

    /**
     * Triggers new chat creation using Gemini's native SPA navigation.
     */
    createNewChatNative() {
        const newChat = document.querySelector(this.selectors.newChatLink) || 
                        document.querySelector(this.selectors.newChatButton);
        if (newChat) {
            newChat.click();
        } else {
            window.location.assign('https://gemini.google.com/app');
        }
    }

    /**
     * Checks if the Gemini UI has fully loaded essential elements.
     * @returns {boolean}
     */
    isReady() {
        return !!(document.querySelector(this.selectors.myStuffButton) || 
                  document.querySelector(this.selectors.newChatLink) || 
                  document.querySelector(this.selectors.chatHistoryList));
    }
}

