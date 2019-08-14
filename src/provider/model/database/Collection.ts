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
    private _transactions: Promise<any>[];

    constructor(database: RxDatabase) {
        this._database = database;
        this._transactions = [];
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
        await this.awaitTransactions();

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
        await this.awaitTransactions();

        const documents = await this._collection.find().exec();

        return documents.map(document => document.toJSON(false));
    }

    /**
     * Updates an existing record, or inserts a new one if one is not existing.
     * @param document Record to insert.
     */
    public async upsert(document: T): Promise<void> {
        this._transactions.push(this._collection.atomicUpsert(document));
    }

    /**
     * Deletes a record from the collection.
     * @param document Record to delete.
     */
    public async delete(document: T): Promise<void> {
        await this.awaitTransactions();

        const documentToDelete = await this._collection.findOne({id: document.id}).remove();

        if (!documentToDelete) {
            throw new Error(`Delete failed. Requested document with id ${document.id} was not found.`);
        }
    }

    /**
     * Deletes an array of records from the collection.
     * @param documents An array of records to delete.
     */
    public async deleteMany(documents: T[]): Promise<void> {
        await this.awaitTransactions();

        const ids = documents.map(doc => doc.id);
        const documentsToDelete = await this._collection.find({id: {$in: ids}}).remove();

        if (documents.length !== documentsToDelete.length) {
            const notDeleted = documents.filter(doc => !documentsToDelete.find((delDoc => delDoc.id === doc.id))).map(filtered => filtered.id);
            if (notDeleted.length) {
                throw new Error(`Delete failed: Requested documents with ids ${notDeleted} were not found.`);
            }
        }
    }

    private async awaitTransactions() {
        await Promise.all(this._transactions);
    }

    private loadSchema(schemaConfig: SchemaConfig) {
        const schema: RxJsonSchema = require(`../../../../res/provider/schemas/${schemaConfig.outputFile}`);

        schema.version = schemaConfig.version;
        schema.properties.id.primary = true;

        return schema;
    }
}
