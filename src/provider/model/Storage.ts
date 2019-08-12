// eslint-disable-next-line import/named, Eslint cannot locate the rxdb modules. TS is able locate them OK. This is due to the module allowing cherry picking.
import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, RxCollectionCreator, RxSchema} from 'rxdb';
import {injectable} from 'inversify';

import {AsyncInit} from '../controller/AsyncInit';

import {StoredNotification} from './StoredNotification';

export type NotificationDocument = RxDocument<StoredNotification>;
export type NotificationCollection = RxCollection<StoredNotification, {}, DefaultCollectionMethods>;

export type SettingsDocument = RxDocument<StoredSettings>;
export type SettingsCollection = RxCollection<StoredSettings, {}, DefaultCollectionMethods>;

type StoredIdTypes = StoredSettings['id']|StoredNotification['id'];

type Collections = {
    db_notifications: NotificationCollection,
    db_settings: SettingsCollection
}

type DocumentTypes = NotificationDocument|SettingsDocument;
type CollectionTypes = Collections[keyof Collections];
type ServiceDatabase = RxDatabase<Collections>;

/**
 * Added in TS 3.5.1.  Project is not yet there, so polyfill.
 */
type Omit<T, K extends string | number | symbol> = { [P in Exclude<keyof T, K>]: T[P]; }

interface DefaultCollectionMethods {
    [key: string]: Function,
    getAll: <T extends DocumentTypes>() => Promise<T[]>;
    getDoc: <T extends DocumentTypes>(id: StoredIdTypes) => Promise<T>
}

interface StoredSettings {
    id: SettingsMap,
    value: string|boolean;
}

/**
 * List of available settings in the settings collection.
 */
export const enum SettingsMap {
    WINDOW_VISIBLE = 'windowVisible'
}

/**
 * List of available collections on the database.
 */
export const enum StorageMap {
    NOTIFICATIONS = 'db_notifications',
    SETTINGS = 'db_settings'
}

@injectable()
export class Storage extends AsyncInit {
    public static readonly DATABASE_VERSION: number = 0;
    private readonly _schemas: Map<StorageMap, RxJsonSchema>;

    private _database!: ServiceDatabase;

    constructor() {
        super();

        this._schemas = new Map<StorageMap, RxJsonSchema>();
        this.setupSchemas();
    }

    /**
     * Returns a collection with the provided collection name.
     */
    public async get<T extends CollectionTypes>(collectionName: StorageMap): Promise<T> {
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
            this.createCollection(StorageMap.NOTIFICATIONS),
            this.createCollection(StorageMap.SETTINGS)
        ]);
    }

    /**
     * Creates an RxDB collection for the service with some properties being enforced for clarity.
     * @param name The name of the collection.  This should be matched against `StorageMap`.
     * @param options Optional RxDB Collection properties
     */
    private async createCollection(name: StorageMap, options?: Omit<RxCollectionCreator, 'name'|'schema'>): Promise<RxCollection> {
        const schema: RxJsonSchema | undefined = this._schemas.get(name);

        if (!schema) {
            throw new Error(`No schema found for ${name}`);
        }

        const migrationStrategies: {[key: string]: (data: DocumentTypes) => Promise<DocumentTypes>} = {};
        for (let x = 1; x <= Storage.DATABASE_VERSION; x++) {
            migrationStrategies[x] = (data: DocumentTypes) => this.migrationHandler(x, name, data);
        }

        return this._database.collection({name, schema, migrationStrategies, statics: defaultCollectionMethods, ...options});
    }

    /**
     * Loads and manipulates collection schemas
     */
    private setupSchemas(): void {
        const notificationSchema: RxJsonSchema<StoredNotification> = require('./schemas/Notifications.schema.json');
        const settingsSchema: RxJsonSchema<StoredSettings> = require('./schemas/Settings.schema.json');

        // TODO
        // Decorate schema jsons with needed missing fields.  Schema files are auto generated from TS types.
        notificationSchema.version = Storage.DATABASE_VERSION;
        settingsSchema.version = Storage.DATABASE_VERSION;

        notificationSchema.properties.id.primary = true;

        this._schemas.set(StorageMap.NOTIFICATIONS, notificationSchema);
        this._schemas.set(StorageMap.SETTINGS, settingsSchema);
    }

    /**
     * Handles the migration strategy routes for the database on version upgrade.
     * @param toVersion Version we are upgrading to.
     * @param name Name of the collection being upgraded.
     * @param data The rx document of the existing data.
     */
    private async migrationHandler(toVersion: number, name: StorageMap, data: DocumentTypes): Promise<DocumentTypes> {
        switch (name) {
            case StorageMap.NOTIFICATIONS: {
                return notificationUpgradeHandler(toVersion, data as NotificationDocument);
            }
            case StorageMap.SETTINGS: {
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

