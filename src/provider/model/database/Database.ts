import {injectable} from 'inversify';
import Dexie from 'dexie';

import {StoredSettings} from '../StoredSettings';
import {StoredNotification} from '../StoredNotification';
import {deferredPromise, DeferredPromise} from '../../common/deferredPromise';
import {AsyncInit} from '../../controller/AsyncInit';

import {Collection} from './Collection';

export const enum CollectionMap {
    NOTIFICATIONS = 'notifications',
    SETTINGS = 'settings'
}

export type Collections = {
    [CollectionMap.NOTIFICATIONS]: StoredNotification;
    [CollectionMap.SETTINGS]: StoredSettings;
};

@injectable()
export class Database extends AsyncInit {
    private _database: Dexie;
    private _collections: Map<CollectionMap, Collection<any>>;
    private _databaseReadyPromise: DeferredPromise<this>;

    constructor () {
        super();

        this._database = new Dexie('Notifications_Service');
        this._collections = new Map();
        this._databaseReadyPromise = deferredPromise();

        this._database.version(1).stores({
            notifications: '&id',
            settings: '&id'
        });

        this.createCollections(this._database.tables);

        this._database.open().then(()=>{
            this._databaseReadyPromise[1]();
        });
    }

    protected async init() {
        await this._databaseReadyPromise[0];
    }

    /**
     * Returns a collection of the provided name.
     * @param collectionName The collection name.
     */
    public get<T extends keyof Collections>(collectionName: T): Collection<Collections[T]> {
        const table = this._collections.get(collectionName);

        if (table) {
            return table;
        } else {
            throw new Error('No table found');
        }
    }

    private createCollections(tables: Dexie.Table<Collections[keyof Collections], string>[]) {
        tables.forEach(table => {
            this._collections.set(table.name as CollectionMap, new Collection(table));
        });
    }
}
