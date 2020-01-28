import {injectable} from 'inversify';
import Dexie from 'dexie';

import {StoredSetting} from '../StoredSetting';
import {StoredNotification} from '../StoredNotification';
import {StoredApplication} from '../Environment';
import {AsyncInit} from '../../controller/AsyncInit';
import {DatabaseError} from '../Errors';
import {NotificationInternal} from '../../../client/internal';

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

        this._database.version(1).stores({
            [CollectionMap.NOTIFICATIONS]: '&id',
            [CollectionMap.SETTINGS]: '&id'
        });

        this._database.version(2).stores({
            [CollectionMap.APPLICATIONS]: '&id'
        }).upgrade(async (transaction: Dexie.Transaction) => {
            console.groupCollapsed('Migrating to database version 2');

            const typedTransaction = (transaction as Dexie.Transaction & {[CollectionMap.NOTIFICATIONS]: Dexie.Table<StoredNotification, string>});
            const collection = typedTransaction[CollectionMap.NOTIFICATIONS].toCollection();

            await collection.modify((notification: StoredNotification) => {
                // Notifications created before the expiration feature will have undefined "expiry", so we manually set it to null
                if (typeof notification.notification.expires !== 'number' && notification.notification.expires !== null) {
                    console.log(`Setting "expires" to null on notification ${notification.id}`);

                    const note = notification.notification as NotificationInternal;
                    note.expires = null;
                }
            });

            console.groupEnd();
        });

        this.createCollections(this._database.tables);
    }

    protected async init(): Promise<void> {
        try {
            await this._database.open();
        } catch (e) {
            // Version 1 database may or may not have the Applications store, so we need to handle both cases
            if (e instanceof Dexie.DexieError) {
                console.warn('Failed to open database, reattempting with alternative version 1 schema');

                this._database.version(1).stores({
                    [CollectionMap.NOTIFICATIONS]: '&id',
                    [CollectionMap.SETTINGS]: '&id',
                    [CollectionMap.APPLICATIONS]: '&id'
                });

                await this._database.open();
            } else {
                throw e;
            }
        }
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
