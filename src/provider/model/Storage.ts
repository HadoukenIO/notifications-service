import localforage from 'localforage';

export const settingsStorage = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'notifications',
    storeName: 'settings'
});

export const notificationStorage = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'notifications',
    storeName: 'notifications'
});

// Mount on window
if (window !== undefined) {
    Object.assign(window, {settingsStorage, notificationStorage});
}
