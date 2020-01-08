import {injectable} from 'inversify';
import Dexie from 'dexie';

import {StoredSetting} from '../StoredSetting';
import {StoredNotification} from '../StoredNotification';
import {StoredApplication} from '../Environment';
import {AsyncInit} from '../../controller/AsyncInit';
import {DatabaseError} from '../Errors';

import {Collection} from './Collection';

export const enum CollectionMap {
    NOTIFICATIONS = 'notifications',
    SETTINGS = 'settings',
    APPLICATIONS = 'applications'
}

export interface Collections {
    [CollectionMap.NOTIFICATIONS]: StoredNotification;
    [CollectionMap.SETTINGS]: StoredSetting;
    [CollectionMap.APPLICATIONS]: StoredApplication;
}

@injectable()
export class Database extends AsyncInit {
    private readonly _database: Dexie;
    private readonly _collections: Map<CollectionMap, Collection<any>>;

    constructor() {
        super();
        this._database = new Dexie('notifications-service');
        this._collections = new Map<CollectionMap, Collection<any>>();

        this._database.version(2).stores({
            [CollectionMap.NOTIFICATIONS]: '&id',
            [CollectionMap.SETTINGS]: '&id',
            [CollectionMap.APPLICATIONS]: '&id'
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
            throw new DatabaseError(`Table with id ${collectionName} not found.`);
        }
    }

    private createCollections(tables: Dexie.Table<Collections[keyof Collections], string>[]): void {
        tables.forEach((table) => {
            this._collections.set(table.name as CollectionMap, new Collection(table));
        });
    }
}
