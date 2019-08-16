import {injectable} from 'inversify';
import Dexie from 'dexie';

import {StoredSetting} from '../StoredSetting';
import {StoredNotification} from '../StoredNotification';
import {AppInitData} from '../ClientHandler';
import {AsyncInit} from '../../controller/AsyncInit';

import {Collection} from './Collection';

export const enum CollectionMap {
    NOTIFICATIONS = 'notifications',
    SETTINGS = 'settings',
    CLIENTS = 'clients'
}

export type Collections = {
    [CollectionMap.NOTIFICATIONS]: StoredNotification;
    [CollectionMap.SETTINGS]: StoredSetting;
    [CollectionMap.CLIENTS]: AppInitData;
};

@injectable()
export class Database extends AsyncInit {
    private _database: Dexie;
    private _collections: Map<CollectionMap, Collection<any>>;

    constructor () {
        super();

        this._database = new Dexie('notifications-service');
        this._collections = new Map<CollectionMap, Collection<any>>();

        this._database.version(1).stores({
            [CollectionMap.NOTIFICATIONS]: '&id',
            [CollectionMap.SETTINGS]: '&id',
            [CollectionMap.CLIENTS]: '&id'
        });

        this.createCollections(this._database.tables);
    }

    protected async init(): Promise<void> {
        await this._database.open();
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
            throw new Error(`Table with id ${collectionName} not found.`);
        }
    }

    private createCollections(tables: Dexie.Table<Collections[keyof Collections], string>[]): void {
        tables.forEach(table => {
            this._collections.set(table.name as CollectionMap, new Collection(table));
        });
    }
}
