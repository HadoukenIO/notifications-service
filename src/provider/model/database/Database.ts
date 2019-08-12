// eslint-disable-next-line import/named, Eslint cannot locate the rxdb modules. TS is able locate them OK. This is due to the module allowing cherry picking.
import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, RxCollectionCreator} from 'rxdb';
import {injectable} from 'inversify';

import {AsyncInit} from '../../controller/AsyncInit';
import {StoredNotification} from '../StoredNotification';
import {StoredSettings} from '../StoredSettings';

/**
 * List of available collections on the database.
 *
 * If a new collection is added, make sure to generate and configure its schema.
 */
export const enum CollectionMap {
    NOTIFICATIONS = 'db_notifications',
    SETTINGS = 'db_settings'
}

export type NotificationDocument = RxDocument<StoredNotification>;
export type NotificationCollection = RxCollection<StoredNotification, {}, DefaultCollectionMethods>;

export type SettingsDocument = RxDocument<StoredSettings>;
export type SettingsCollection = RxCollection<StoredSettings, {}, DefaultCollectionMethods>;

type Collections = {
    [CollectionMap.NOTIFICATIONS]: NotificationCollection;
    [CollectionMap.SETTINGS]: SettingsCollection;
}

type DocumentTypes = NotificationDocument|SettingsDocument;
type StoredIdTypes = (StoredSettings|StoredNotification)['id'];

type CollectionTypes = Collections[keyof Collections];

interface DefaultCollectionMethods {
    [key: string]: Function,
    getAll: <T extends DocumentTypes>() => Promise<T[]>;
    getDoc: <T extends DocumentTypes>(id: StoredIdTypes) => Promise<T>
}

/**
 * Added in TS 3.5.1.  Project is not yet there, so polyfill.
 */
type Omit<T, K extends string | number | symbol> = { [P in Exclude<keyof T, K>]: T[P]; }

@injectable()
export class Database extends AsyncInit {
    /**
     * Schema versions for each of the collections.
     *
     * If a version is changed make sure to execute `npm run schema:generate` to generate a new schema and commit.
     */
    public static readonly DATABASE_VERSION = {
        [CollectionMap.NOTIFICATIONS]: 0,
        [CollectionMap.SETTINGS]: 0
    }

    private readonly _schemas: Map<CollectionMap, RxJsonSchema>;

    private _database!: RxDatabase<Collections>;;

    constructor() {
        super();

        this._schemas = new Map<CollectionMap, RxJsonSchema>();
        this.setupSchemas();
    }

    /**
     * Returns a collection with the provided collection name.
     */
    public async get<T extends CollectionTypes>(collectionName: CollectionMap): Promise<T> {
        await this.initialized;

        const collection: T = this._database[collectionName] as T;

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

        // Initalize all of the collections
        await Promise.all([
            this.createCollection(CollectionMap.NOTIFICATIONS),
            this.createCollection(CollectionMap.SETTINGS)
        ]);
    }

    /**
     * Creates an RxDB collection for the service with some properties being enforced for clarity.
     * @param name The name of the collection.  This should be matched against `StorageMap`.
     * @param options Optional RxDB Collection properties
     */
    private async createCollection(name: CollectionMap, options?: Omit<RxCollectionCreator, 'name'|'schema'>): Promise<RxCollection> {
        const schema: RxJsonSchema | undefined = this._schemas.get(name);

        if (!schema) {
            throw new Error(`No schema found for ${name}`);
        }

        const migrationStrategies: {[key: string]: (data: DocumentTypes) => Promise<DocumentTypes>} = {};
        for (let x = 1; x <= Database.DATABASE_VERSION[name]; x++) {
            migrationStrategies[x] = (data: DocumentTypes) => this.migrationHandler(x, name, data);
        }

        return this._database.collection({name, schema, migrationStrategies, statics: defaultCollectionMethods, ...options});
    }

    /**
     * Loads and manipulates collection schemas.
     *
     * If adding a new schema, make sure to assign a version and primary property to it.
     */
    private setupSchemas(): void {
        const notificationSchema: RxJsonSchema<StoredNotification> = require('./schemas/Notifications.schema.json');
        const settingsSchema: RxJsonSchema<StoredSettings> = require('./schemas/Settings.schema.json');

        // TODO
        // Decorate schema jsons with needed missing fields.  Schema files are auto generated from TS types.
        notificationSchema.version = Database.DATABASE_VERSION[CollectionMap.NOTIFICATIONS];
        settingsSchema.version = Database.DATABASE_VERSION[CollectionMap.SETTINGS];

        notificationSchema.properties.id.primary = true;
        settingsSchema.properties.id.primary = true;

        this._schemas.set(CollectionMap.NOTIFICATIONS, notificationSchema);
        this._schemas.set(CollectionMap.SETTINGS, settingsSchema);
    }

    /**
     * Handles the migration strategy routes for the database on version upgrade.
     * @param toVersion Version we are upgrading to.
     * @param name Name of the collection being upgraded.
     * @param data The rx document of the existing data.
     */
    private async migrationHandler(toVersion: number, name: CollectionMap, data: DocumentTypes): Promise<DocumentTypes> {
        switch (name) {
            case CollectionMap.NOTIFICATIONS: {
                return notificationUpgradeHandler(toVersion, data as NotificationDocument);
            }
            case CollectionMap.SETTINGS: {
                return settingsUpgradeHandler(toVersion, data as SettingsDocument);
            }
        }
    }
}

/**
 * Handles version upgrades to the Settings table.
 * @param toVersion Version we are upgrading to.
 * @param data The rx document of the existing data.
 */
async function settingsUpgradeHandler(toVersion: number, data: SettingsDocument): Promise<SettingsDocument> {
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
async function notificationUpgradeHandler(toVersion: number, data: NotificationDocument): Promise<NotificationDocument> {
    switch (toVersion) {
        default: {
            return data;
        }
    }
}

/**
 * Default methods available to collections
 */
const defaultCollectionMethods: DefaultCollectionMethods = {
    /**
     * Returns all documents from a collection.
     */
    getAll: async function<T extends DocumentTypes>(this: CollectionTypes): Promise<T[]> {
        return this.find().exec() as Promise<T[]>;
    },
    /**
     * Returns a single document from a collection.
     * @param id The primary id for the document.
     */
    getDoc: async function<T extends DocumentTypes>(this: CollectionTypes, id: StoredIdTypes): Promise<T> {
        return this.findOne().where('id').equals(id).exec() as Promise<T>;
    }
};

