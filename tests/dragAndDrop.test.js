import DragAndDrop from '../src/scripts/dragAndDrop.js';

jest.mock('../src/scripts/utils.js', () => ({
    showToast: jest.fn(),
    extractRealConversationIdFromCurrentUrl: jest.fn()
}));

describe('DragAndDrop', () => {
    let folderManager;
    let storage;
    let dnd;

    beforeEach(() => {
        folderManager = {
            moveConversationsToFolder: jest.fn().mockResolvedValue(true)
        };
        storage = {
            getFolders: jest.fn().mockResolvedValue({ Work: [], Personal: [] }),
            saveFolders: jest.fn().mockResolvedValue(true)
        };
        dnd = new DragAndDrop(storage, folderManager);
    });

    test('handleDrop moves bulk selected chats into target folder', async () => {
        const dataTransfer = {
            data: {},
            setData(key, value) { this.data[key] = value; },
            getData(key) { return this.data[key] || ''; }
        };

        dataTransfer.setData('application/json', JSON.stringify({ type: 'bulk', ids: ['id1', 'id2'], folder_from: 'Work' }));

        const event = {
            preventDefault: jest.fn(),
            currentTarget: {
                dataset: { folderName: 'Personal' },
                classList: {
                    contains: () => false,
                    remove: jest.fn()
                }
            }
        };
        event.dataTransfer = dataTransfer;

        await dnd.handleDrop(event);
        expect(folderManager.moveConversationsToFolder).toHaveBeenCalledWith(['id1', 'id2'], 'Work', 'Personal');
    });
});
