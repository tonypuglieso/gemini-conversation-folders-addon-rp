import RightPanel from '../src/scripts/components/RightPanel.js';
import { showToast } from '../src/scripts/utils.js';

jest.mock('../src/scripts/utils.js', () => ({
    showToast: jest.fn()
}));

describe('RightPanel', () => {
    let rightPanel;

    beforeEach(() => {
        document.body.innerHTML = '';
        rightPanel = new RightPanel();
        rightPanel.mount(document.body);
    });

    test('should render with hidden new-chat-folder button by default', () => {
        const button = document.getElementById('right-new-chat-folder-btn');
        expect(button).not.toBeNull();
        expect(button.style.display).toBe('none');
    });

    test('should show new-chat-folder button when inside a folder', async () => {
        rightPanel.currentFolderView = 'Work';
        await rightPanel.updateData({ Work: [] }, []);

        const button = document.getElementById('right-new-chat-folder-btn');
        expect(button).not.toBeNull();
        expect(button.style.display).toBe('flex');
    });

    test('renders no direct "Nuevo Chat" folder button in folder section', () => {
        const button = document.getElementById('right-new-chat-btn');
        expect(button).toBeNull();
    });
    test('showSettingsMenu no longer contiene "Modo Compacto (Activo)"', () => {
        rightPanel.showSettingsMenu();
        const menu = document.querySelector('.settings-menu-overlay');
        expect(menu).toBeTruthy();
        expect(menu.textContent).not.toContain('Modo Compacto (Activo)');
    });

    test('handleBulkDelete removes from folder(s) only and does not touch Gemini chat state', async () => {
        window.geminiOrganizerAppInstance = {
            folderManager: {
                removeConversationFromFolder: jest.fn(),
            },
            storage: {
                getFolders: jest.fn().mockResolvedValue({ Work: [], Personal: [] }),
            },
        };

        rightPanel.showConfirmPanel = (message, onConfirm) => onConfirm();
        rightPanel.updateData = jest.fn();

        rightPanel.currentFolderView = 'Work';
        rightPanel.isBulkMode = true;
        rightPanel.selectedConvIds = new Set(['id1', 'id2']);

        await rightPanel.handleBulkDelete();

        expect(window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder).toHaveBeenCalledTimes(2);
        expect(window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder).toHaveBeenCalledWith('Work', 'id1');
        expect(window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder).toHaveBeenCalledWith('Work', 'id2');
        expect(rightPanel.isBulkMode).toBe(false);
        expect(rightPanel.selectedConvIds.size).toBe(0);

        // Bulk delete from all folders when no folder view is selected.
        rightPanel.currentFolderView = null;
        rightPanel.isBulkMode = true;
        rightPanel.selectedConvIds = new Set(['id3']);
        window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder.mockClear();

        await rightPanel.handleBulkDelete();

        expect(window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder).toHaveBeenCalledWith('Work', 'id3');
        expect(window.geminiOrganizerAppInstance.folderManager.removeConversationFromFolder).toHaveBeenCalledWith('Personal', 'id3');
        expect(rightPanel.isBulkMode).toBe(false);
        expect(rightPanel.selectedConvIds.size).toBe(0);
    });
});
