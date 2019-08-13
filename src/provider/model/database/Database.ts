// eslint-disable-next-line import/named, Eslint cannot locate the rxdb modules. TS is able locate them OK. This is due to the module allowing cherry picking.
import RxDB, {RxDatabase, RxCollection, RxDocument} from 'rxdb';
import {injectable} from 'inversify';

import {AsyncInit} from '../../controller/AsyncInit';
import {StoredNotification} from '../StoredNotification';
import {StoredSettings} from '../StoredSettings';
import {Collection, CollectionsConfig} from '../database/Collection';

/**
 * List of available collections on the database.
 *
 * If a new collection is added, make sure to generate and configure its schema.
 */
export const enum CollectionMap {
    NOTIFICATIONS = 'db_notifications',
    SETTINGS = 'db_settings'
}

export type Collections = {
    [CollectionMap.NOTIFICATIONS]: StoredNotification;
    [CollectionMap.SETTINGS]: StoredSettings;
};

type RxCollections = {
    [K in keyof Collections]: RxCollection<Collections[K]>;
};

const migrationHandlers = {
    [CollectionMap.NOTIFICATIONS]: notificationUpgradeHandler,
    [CollectionMap.SETTINGS]: settingsUpgradeHandler
};

@injectable()
export class Database extends AsyncInit {
    private _database!: RxDatabase<RxCollections>;
    private _collections: Map<CollectionMap, Collection<any>>

    constructor() {
        super();

        this._collections = new Map<CollectionMap, Collection<any>>();
    }

    /**
     * Returns a collection with the provided collection name.
     */
    public async get<T extends keyof Collections>(collectionName: T): Promise<Collection<Collections[T]>> {
        await this.initialized;

        const collection = this._collections.get(collectionName);

        if (collection) {
            return collection;
        } else {
            throw new Error(`No collection found: ${collectionName}`);
        }
    }

    protected async init(): Promise<void> {
        RxDB.plugin(require('pouchdb-adapter-idb'));

        this._database = await RxDB.create({
            name: 'notifications_service',
            adapter: 'idb'
        });

        const collections: CollectionsConfig[] = require('../../../../res/provider/schemas/collections.json').collections;

        await Promise.all(collections.map(config => {
            const collection = new Collection<Collections[keyof Collections]>(this._database);
            this._collections.set(config.name, collection);

            return collection.init(config, migrationHandlers[config.name]);
        }));
    }
}

/**
 * Handles version upgrades to the Settings table.
 * @param toVersion Version we are upgrading to.
 * @param data The rx document of the existing data.
 */
async function settingsUpgradeHandler(toVersion: number, data: RxDocument<StoredSettings>): Promise<RxDocument<StoredSettings>> {
    switch (toVersion) {
        default: {
            return data;
        }
    }
}

/**
 * Handles version upgrades to the Notifications table.
 * @param toVersion Version we are upgrading to.
 * @param data The rx document of the existing data.
 */
async function notificationUpgradeHandler(
    toVersion: number,
    data: RxDocument<StoredNotification>
): Promise<RxDocument<StoredNotification>> {
    switch (toVersion) {
        default: {
            return data;
        }
    }
}
