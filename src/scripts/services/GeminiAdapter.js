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
            chatHistoryList: '.chat-history-list',
            sidebarContainer: 'mat-sidenav-container', // Broad container, might need refinement
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
        if (historyList) return { element: historyList.parentNode, position: 'before' }; // Insert before the list container usually

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
     * Checks if the Gemini UI has fully loaded essential elements.
     * @returns {boolean}
     */
    isReady() {
        return !!(document.querySelector(this.selectors.myStuffButton) || 
                  document.querySelector(this.selectors.newChatButton) || 
                  document.querySelector(this.selectors.chatHistoryList));
    }
}

