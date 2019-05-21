import localforage from 'localforage';

export const storage = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'notifications',
    storeName: 'state'
});
