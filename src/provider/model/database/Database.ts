import {injectable} from 'inversify';
import Dexie from 'dexie';

import {StoredSetting} from '../StoredSetting';
import {StoredNotification} from '../StoredNotification';
import {StoredApplication} from '../Environment';
import {AsyncInit} from '../../controller/AsyncInit';
import {DatabaseError} from '../Errors';
import {NotificationInternal} from '../../../client/internal';
import {PartiallyWritable} from '../../utils/types';

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

            const typedTransaction = (transaction as Dexie.Transaction & {
                [CollectionMap.NOTIFICATIONS]: Dexie.Table<StoredNotification, string>;
                [CollectionMap.APPLICATIONS]: Dexie.Table<StoredApplication, string>;
            });
            const notificationsCollection = typedTransaction[CollectionMap.NOTIFICATIONS].toCollection();
            const applicationsCollection = typedTransaction[CollectionMap.APPLICATIONS].toCollection();

            await notificationsCollection.modify((notification: StoredNotification) => {
                // Notifications created before the expiration feature will have undefined "expiry", so we manually set it to null
                if (typeof notification.notification.expires !== 'number' && notification.notification.expires !== null) {
                    console.log(`Setting "expires" to null on notification ${notification.id}`);

                    const note = notification.notification as PartiallyWritable<NotificationInternal, 'expires'>;
                    note.expires = null;
                }

                // Notifications created before support of "onClose" and "onExpire" will have them undefined, so we manually set them to null
                if (!notification.notification.onClose && notification.notification.onClose !== null) {
                    console.log(`Setting "onClose" to null on notification ${notification.id}`);

                    const note = notification.notification as PartiallyWritable<NotificationInternal, 'onClose'>;
                    note.onClose = null;
                }
                if (!notification.notification.onExpire && notification.notification.onExpire !== null) {
                    console.log(`Setting "onExpire" to null on notification ${notification.id}`);

                    const note = notification.notification as PartiallyWritable<NotificationInternal, 'onExpire'>;
                    note.onExpire = null;
                }
            });

            await applicationsCollection.modify((application: StoredApplication) => {
                // StoredApplication may have been created without a title, so copy from ID
                if (application.title === undefined) {
                    console.log(`Setting "title" on application ${application.id}`);

                    const app = application as PartiallyWritable<StoredApplication, 'title'>;
                    app.title = app.id;
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
