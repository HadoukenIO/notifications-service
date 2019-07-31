import localforage from 'localforage';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

/**
 * Webpack gives us the semver as a string.  Remove the dots and make it an int.
 */
const PACKAGE_VERSION_NUM: number = parseInt(PACKAGE_VERSION.replace(/\./g, ''));

export const settingsStorage = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'notifications',
    storeName: 'settings',
    version: PACKAGE_VERSION_NUM
});

export const notificationStorage = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'notifications',
    storeName: 'notifications',
    version: PACKAGE_VERSION_NUM
});

settingsStorage.ready().then(async (): Promise<void> => {
    const storedVersion = await settingsStorage.getItem<number>('dbVersion');
    const dbVersion = settingsStorage.config().version!;

    if (storedVersion < dbVersion) {
        await upgradeDatabase();
    }
});

async function upgradeDatabase(): Promise<void> {
    const storedVersion = await settingsStorage.getItem<number>('dbVersion');
    const dbVersion = settingsStorage.config().version;

    // Example code.  Fill in actual upgrade paths here.
    if (storedVersion < 2) {
        // Do some upgrade to v2
        await settingsStorage.setItem('dbVersion', 2);
    } else if (storedVersion < 3) {
        // Do some upgrade to v3
        await settingsStorage.setItem('dbVersion', 3);
    } else {
        await settingsStorage.setItem('dbVersion', dbVersion);
        return;
    }

    return upgradeDatabase();
}
