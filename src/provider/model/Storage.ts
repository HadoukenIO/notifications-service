import localforage from 'localforage';
import {injectable} from 'inversify';

import {AsyncInit} from '../controller/AsyncInit';

/**
 * List of available storages.
 */
export const enum StorageMap {
    NOTIFICATIONS = 'notifications',
    SETTINGS = 'settings'
}

@injectable()
export class Storage extends AsyncInit {
    /**
     * This value should be updated any time changes are made to the notification shape.
     * Must remain in number format.  LocalForage does not support semver.
     */
    public static readonly DATABASE_VERSION: number = 1.0;
    private readonly _storages: Map<string, LocalForage>;

    constructor() {
        super();
        this._storages = new Map<string, LocalForage>();

        [StorageMap.NOTIFICATIONS, StorageMap.SETTINGS].forEach(storeName => {
            const instance = localforage.createInstance({
                driver: localforage.INDEXEDDB,
                version: Storage.DATABASE_VERSION,
                name: 'notifications',
                storeName
            });

            this._storages.set(storeName, instance);
        });
    }

    public get(storeName: StorageMap): LocalForage {
        const requestedStore: LocalForage|undefined = this._storages.get(storeName);

        if (requestedStore) {
            return requestedStore;
        } else {
            throw new Error(`No store found: ${storeName}`);
        }
    }

    protected async init(): Promise<void> {
        await Promise.all([...this._storages.values()].map(storage => storage.ready()));

        const settingsStorage = this.get(StorageMap.SETTINGS);

        const storedVersion = await settingsStorage.getItem<number>('dbVersion');

        if (!storedVersion) {
            await this.initializeDatabase();
        } else if (storedVersion < Storage.DATABASE_VERSION) {
            console.log(`Upgrading database from version ${storedVersion} to ${Storage.DATABASE_VERSION}`);
            await this.upgradeDatabase();
        }
    }

    private async upgradeDatabase(): Promise<void> {
        const settingsStorage = this.get(StorageMap.SETTINGS);

        const dbVersion = settingsStorage.config().version!;
        const storedVersion = await settingsStorage.getItem<number>('dbVersion');

        // Example code.  Fill in actual upgrade paths here.
        if (storedVersion < 2) {
            // Do some example upgrade to v2
            await settingsStorage.setItem('dbVersion', 2);
        } else if (storedVersion < 3) {
            // Do some example upgrade to v3
            await settingsStorage.setItem('dbVersion', 3);
        } else {
            // Finally when no more upgrades are needed, set dbVersion to latest.
            await settingsStorage.setItem('dbVersion', dbVersion);
            return;
        }

        return this.upgradeDatabase();
    }

    private async initializeDatabase(): Promise<void> {
        const settings = this.get(StorageMap.SETTINGS);

        await settings.setItem('dbVersion', settings.config().version);
    }
}
