// eslint-disable-next-line import/named, Eslint cannot locate the rxdb modules. TS is able locate them OK. This is due to the module allowing cherry picking.
import {RxDatabase, RxCollection, RxDocument, RxJsonSchema, RxCollectionCreator} from 'rxdb';

import {CollectionMap, Collections} from './Database';

/**
 * Added in TS 3.5.1.  Project is not yet there, so polyfill.
 */
type Omit<T, K extends string | number | symbol> = { [P in Exclude<keyof T, K>]: T[P]; }

export type CollectionInitOptions = Omit<RxCollectionCreator, 'name'|'schema'|'migrationStrategies'>
export type MigrationHandler<T = any> = (toVersion: number, data: RxDocument<T>) => Promise<RxDocument<T>>

export interface CollectionsConfig {
    name: CollectionMap,
    schema: SchemaConfig,
}

interface SchemaConfig {
    version: number,
    typeName: string,
    outputFile: string,
    sourceFile: string
}

export class Collection<T extends Collections[keyof Collections]> {
    private _database: RxDatabase;
    private _collection!: RxCollection<T>;

    constructor(database: RxDatabase) {
        this._database = database;
    }

    public async init(config: CollectionsConfig, migrationHandler: MigrationHandler) {
        const migrationStrategies: {[key: string]: (data: RxDocument<T>) => Promise<RxDocument<T>>} = {};

        for (let x = 1; x <= config.schema.version; x++) {
            migrationStrategies[x] = (data: RxDocument<T>) => migrationHandler(x, data);
        }

        this._collection = await this._database.collection({
            name: config.name,
            schema: this.loadSchema(config.schema),
            migrationStrategies
        });
    }

    /**
     * Returns a record from the collection. The search is based on the primary key (id).
     * @param id Primary key
     */
    public async get(id: string): Promise<T> {
        const document = await this._collection.findOne(id).exec();

        if (document) {
            return document.toJSON(false);
        } else {
            throw new Error(`Get failed. Requested document with id ${id} was not found.`);
        }
    }

    /**
     * Returns all records from the collection.
     */
    public async getAll(): Promise<T[]> {
        const documents = await this._collection.find().exec();

        return documents.map(document => document.toJSON(false));
    }

    /**
     * Updates an existing record, or inserts a new one if one is not existing.
     * @param document Record to insert.
     */
    public async upsert(document: T): Promise<void> {
        await this._collection.atomicUpsert(document);
    }

    /**
     * Deletes a record from the collection.
     * @param document Record to delete.
     */
    public async delete(document: T): Promise<void> {
        const documentToDelete = await this._collection.findOne(document.id).exec();

        if (documentToDelete) {
            await documentToDelete.remove();
            return;
        } else {
            throw new Error(`Delete failed. Requested document with id ${document.id} was not found.`);
        }
    }

    private loadSchema(schemaConfig: SchemaConfig) {
        const schema: RxJsonSchema = require(`../../../../res/provider/schemas/${schemaConfig.outputFile}`);

        schema.version = schemaConfig.version;
        schema.properties.id.primary = true;

        return schema;
    }
}
