import Storage from '../src/scripts/services/Storage.js';

// Mock chrome.storage
global.chrome = {
    runtime: { id: 'test-id' },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
};

// Mock localStorage for fallback behavior
global.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] || null; },
    setItem(key, value) { this._store[key] = value; },
    removeItem(key) { delete this._store[key]; }
};

describe('Storage', () => {
    let storage;

    beforeEach(() => {
        storage = new Storage('testKey');
        jest.clearAllMocks();
    });

    test('should set storage area to local', async () => {
        await storage.setStorageArea('local');
        expect(storage.storageArea).toBe(chrome.storage.local);
    });

    test('should set storage area to sync', async () => {
        await storage.setStorageArea('sync');
        expect(storage.storageArea).toBe(chrome.storage.sync);
    });

    test('should get folders from storage', async () => {
        await storage.setStorageArea('local');
        const mockData = { testKey: { folder1: [] } };
        chrome.storage.local.get.mockResolvedValue(mockData);

        const folders = await storage.getFolders();
        expect(chrome.storage.local.get).toHaveBeenCalledWith('testKey');
        expect(folders).toEqual(mockData.testKey);
    });

    test('should return empty object if no folders found', async () => {
        await storage.setStorageArea('local');
        chrome.storage.local.get.mockResolvedValue({});

        const folders = await storage.getFolders();
        expect(folders).toEqual({});
    });

    test('should save folders to storage', async () => {
        await storage.setStorageArea('local');
        const folders = { folder1: [] };

        await storage.saveFolders(folders);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: folders });
    });

    test('getSettings should return settings from chrome.storage and sync to localStorage', async () => {
        await storage.setStorageArea('local');
        chrome.storage.local.get.mockResolvedValue({ gemini_organizer_settings: { panelWidth: 450, foldersHeight: 55 } });

        const settings = await storage.getSettings();

        expect(settings.panelWidth).toBe(450);
        expect(settings.foldersHeight).toBe(55);
        expect(localStorage.getItem('gemini_organizer_settings')).toBe(JSON.stringify(settings));
    });

    test('getSettings should fallback to localStorage when chrome.runtime is unavailable', async () => {
        const initialChromeRuntime = chrome.runtime;
        chrome.runtime = {}; // simulate unavailable context

        localStorage.setItem('gemini_organizer_settings', JSON.stringify({ panelWidth: 420, foldersHeight: 50 }));

        const settings = await storage.getSettings();

        expect(settings.panelWidth).toBe(420);
        expect(settings.foldersHeight).toBe(50);

        chrome.runtime = initialChromeRuntime;
    });

    test('saveSettings should write both to localStorage and chrome.storage', async () => {
        await storage.setStorageArea('local');

        const newSettings = { panelWidth: 380, foldersHeight: 45 };
        await storage.saveSettings(newSettings);

        expect(JSON.parse(localStorage.getItem('gemini_organizer_settings')).panelWidth).toBe(380);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ gemini_organizer_settings: newSettings });
    });
});
