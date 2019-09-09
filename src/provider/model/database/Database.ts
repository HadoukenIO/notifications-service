import {injectable, inject} from 'inversify';
import Dexie from 'dexie';

import {StoredSetting} from '../StoredSetting';
import {StoredNotification} from '../StoredNotification';
import {StoredApplication} from '../Environment';
import {AsyncInit} from '../../controller/AsyncInit';
import {Inject} from '../../common/Injectables';
import {RootAction, CreateNotification, RemoveNotifications, RegisterClient} from '../../store/Actions';
import {DatabaseError} from '../Errors';
import {ServiceStore} from '../../store/ServiceStore';

import {Collection} from './Collection';

export const enum CollectionMap {
    NOTIFICATIONS = 'notifications',
    SETTINGS = 'settings',
    APPLICATIONS = 'applications'
}

export type Collections = {
    [CollectionMap.NOTIFICATIONS]: StoredNotification;
    [CollectionMap.SETTINGS]: StoredSetting;
    [CollectionMap.APPLICATIONS]: StoredApplication;
};

@injectable()
export class Database extends AsyncInit {
    private readonly _database: Dexie;
    private readonly _collections: Map<CollectionMap, Collection<any>>;

    @inject(Inject.STORE)
    private _store!: ServiceStore;

    constructor() {
        super();
        this._database = new Dexie('notifications-service');
        this._collections = new Map<CollectionMap, Collection<any>>();

        this._database.version(1).stores({
            [CollectionMap.NOTIFICATIONS]: '&id',
            [CollectionMap.SETTINGS]: '&id',
            [CollectionMap.APPLICATIONS]: '&id'
        });

        this.createCollections(this._database.tables);
    }

    protected async init(): Promise<void> {
        await this._database.open();
        this._store.onAction.add(this.onAction, this);
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
        tables.forEach(table => {
            this._collections.set(table.name as CollectionMap, new Collection(table));
        });
    }

    private async onAction(action: RootAction): Promise<void> {
        if (action instanceof CreateNotification) {
            const {notification} = action;
            try {
                await this.get(CollectionMap.NOTIFICATIONS).upsert(notification);
            } catch (error) {
                throw new DatabaseError(`Unable to upsert notification ${notification.id}`, error);
            }
        }
        if (action instanceof RemoveNotifications) {
            const {notifications} = action;
            const ids = notifications.map(note => note.id);
            try {
                await this.get(CollectionMap.NOTIFICATIONS).delete(ids);
            } catch (error) {
                throw new DatabaseError(`Unable to delete notification ${ids}`, error);
            }
        }
        if (action instanceof RegisterClient) {
            const {clientInfo} = action;
            try {
                const collection = this.get(CollectionMap.APPLICATIONS);
                await collection.upsert(clientInfo);
            } catch (error) {
                throw new DatabaseError(`Unable to upsert Client info ${clientInfo}`, error);
            }
        }
    }
}
