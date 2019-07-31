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
