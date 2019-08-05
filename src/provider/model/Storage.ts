import localforage from 'localforage';
import {injectable} from 'inversify';

import {AsyncInit} from '../controller/AsyncInit';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

@injectable()
export class Storage extends AsyncInit {
    private readonly _version: number;
    private _storages: Map<string, LocalForage>;

    constructor() {
        super();
        this._version = parseInt(PACKAGE_VERSION.replace(/\./g, ''));
        this._storages = new Map<string, LocalForage>();

        this.add({
            driver: localforage.INDEXEDDB,
            name: 'notifications',
            storeName: 'settings',
            version: this._version
        });

        this.add({
            driver: localforage.INDEXEDDB,
            name: 'notifications',
            storeName: 'notifications',
            version: this._version
        });
    }

    protected async init(): Promise<void> {
        await Promise.all([...this._storages.values()].map(storage => storage.ready()));

        const settingsStorage = this.get('settings');

        const storedVersion = await settingsStorage.getItem<number>('dbVersion');
        const dbVersion = settingsStorage.config().version!;

        if (!storedVersion) {
            await this.initializeDatabase();
        } else if (storedVersion < dbVersion) {
            console.log(`Upgrading database from version ${storedVersion} to ${dbVersion}`);
            await this.upgradeDatabase();
        }
    }

    private add(options: LocalForageOptions): void {
        const instance = localforage.createInstance(options);
        this._storages.set(options.storeName!, instance);
    }

    private async upgradeDatabase(): Promise<void> {
        const settingsStorage = this.get('settings');
        const notificationStorage = this.get('notifications');

        const dbVersion = settingsStorage.config().version!;
        const storedVersion = await settingsStorage.getItem<number>('dbVersion');

        // Example code.  Fill in actual upgrade paths here.
        if (storedVersion < 2) {
            const notes: any = [];

            // Do some upgrade to v2
            await notificationStorage.iterate((value: any, key: string) => {
                notes.push({key, value: JSON.parse(value)});
            });

            for (const note of notes) {
                note.value.notification.title = note.value.notification.title += `${this._version}`;
                await notificationStorage.setItem(note.key, JSON.stringify(note.value));
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 2500);
                });
            }

            await settingsStorage.setItem('dbVersion', 2);
        } else if (storedVersion < 3) {
            // // Do some upgrade to v3
            await settingsStorage.setItem('dbVersion', 3);
        } else {
            await settingsStorage.setItem('dbVersion', dbVersion);
            return;
        }

        return this.upgradeDatabase();
    }

    private async initializeDatabase() {
        const settings = this.get('settings');

        await settings.setItem('dbVersion', settings.config().version);
    }

    public get(storeName: string): LocalForage {
        return this._storages.get(storeName)!;
    }
}
