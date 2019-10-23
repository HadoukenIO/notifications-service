import Dexie from 'dexie';

import {Collections} from './Database';

type Key<T extends Collections[keyof Collections]> = T['id'];

export class Collection<T extends Collections[keyof Collections]> {
    private readonly _table: Dexie.Table<T, Key<T>>;

    constructor(table: Dexie.Table<T, Key<T>>) {
        this._table = table;
    }

    /**
     * Gets a single record from the collection.
     * @param id Id of the record to get.
     */
    public async get(id: Key<T>): Promise<T|undefined> {
        return this._table.get(id);
    }

    /**
     * Gets many records from the collection.
     * @param ids Ids of the records to get.
     */
    public async getMany(ids: Key<T>[]): Promise<T[]> {
        return this._table.where('id').anyOf(ids).toArray();
    }

    /**
     * Gets all the records from the collection.
     */
    public async getAll(): Promise<T[]> {
        return this._table.toArray();
    }

    /**
     * Updates a record in the collection. If the record does not exist, a new one will be created.
     * @param record The record to update or insert.
     */
    public async upsert(record: T|T[]): Promise<void> {
        if (Array.isArray(record)) {
            await this._table.bulkPut(record);
        } else {
            await this._table.put(record);
        }
    }

    /**
     * Deletes a single or array of records from the collection.
     * @param id Id(s) of the record(s) to delete.
     */
    public async delete(id: Key<T>|Key<T>[]): Promise<void> {
        if (Array.isArray(id)) {
            return this._table.bulkDelete(id);
        } else {
            return this._table.delete(id);
        }
    }
}
