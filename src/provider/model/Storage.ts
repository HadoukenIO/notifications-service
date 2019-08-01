import localforage from 'localforage';
import {injectable} from 'inversify';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

@injectable()
export class Storage {
    private readonly _version: number;
    private _storages: Map<string, LocalForage>;
    private _initialized: Promise<this>;
    constructor() {
        this._version = 1; //parseInt(PACKAGE_VERSION.replace(/\./g, ''));
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

        this._initialized = this.init().then(() => this);
    }

    public get initialized(): Promise<this> {
        return this._initialized;
    }

    private async init(): Promise<void> {
        await Promise.all([...this._storages.values()].map(storage => storage.ready()));

        const settingsStorage = this.get('settings');

        const storedVersion = await settingsStorage.getItem<number>('dbVersion');
        const dbVersion = settingsStorage.config().version!;

        if (!storedVersion) {
            await this.initializeDatabase();
        } else if (storedVersion < dbVersion) {
            await this.upgradeDatabases();
        }

        console.log('storage actually init');
    }

    private add(options: LocalForageOptions): void {
        const instance = localforage.createInstance(options);
        this._storages.set(options.storeName!, instance);
    }

    private async upgradeDatabases(): Promise<void> {
        const settingsStorage = this.get('settings');
        const notificationStorage = this.get('notifications');

        const dbVersion = settingsStorage.config().version!;
        const storedVersion = await settingsStorage.getItem<number>('dbVersion');

        // Example code.  Fill in actual upgrade paths here.
        if (storedVersion < 2) {
            console.log('u1');
            const notes: any = [];

            // Do some upgrade to v2
            await notificationStorage.iterate((value: any, key: string) => {
                notes.push({key, value: JSON.parse(value)});
            });

            for (const note of notes) {
                note.value.notification.title = note.value.notification.title += `${this._version}`;
                await notificationStorage.setItem(note.key, JSON.stringify(note.value));
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 100);
                });
            }

            await settingsStorage.setItem('dbVersion', 2);
        } else if (storedVersion < 3) {
            // // Do some upgrade to v3
            await settingsStorage.setItem('dbVersion', 3);
        } else {
            console.log('u3');
            await settingsStorage.setItem('dbVersion', dbVersion);
            return;
        }

        return this.upgradeDatabases();
    }

    private async initializeDatabase() {
        const settings = this.get('settings');

        await settings.setItem('dbVersion', settings.config().version);
    }

    public get(storeName: string): LocalForage {
        return this._storages.get(storeName)!;
    }
}
