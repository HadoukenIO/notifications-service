import {Entity} from '../../../client/Entity';
import {ITable} from '../models/ITable';
import {PageInfo} from '../models/PageInfo';

/**
 *  @description Interface for low level database access layer
 */
export interface IDatastore<T extends Entity> {
    /**
     * @method initialise Initialises the database and does all setup
     * @param {number} dbVersion The version of the database
     * @param {ITable[]} tablesToCreate These are needed in order to recreate the table names should the version be upgraded
     */
    initialise(dbVersion: number, tablesToCreate: ITable[]): void;

    /**
     * @method create Add an entry into the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} entry Object to insert into the database
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    create(tableName: string, entry: T): Promise<boolean>;

    /**
     * @method remove Deletes an entry in the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} id The id of the entry we want to remove
     * @returns {Promise<boolean>} A value of whether it was successfully removed or not
     */
    remove<T extends string|number>(tableName: string, id: T): Promise<boolean>;

    /**
     * @method removeAll Deletes all entries in the database based on the table
     * name
     * @param {string} tableName The name of the table to perform
     * @returns {Promise<boolean>} A value of whether it has successfully removed all or not
     */
    removeAll(tableName: string): Promise<boolean>;

    /**
     * @method remove Deletes all entries corresponding to the uuid passed in
     * @param {string} tableName The name of the table to perform
     * @param {string} uuid The uuid of the app
     * @returns {Promise<number>} The count of removed entries
     */
    removeByUuid(tableName: string, uuid: string): Promise<number>;

    /**
     * @method update Update an entry into the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} entry Object to update in the database
     * @returns {Promise<boolean>} A value of whether it was successfully updated or not
     */
    update(tableName: string, entry: T): Promise<boolean>;

    /**
     * @method read Reads an entry in the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {string|number} id The id of the entry we want to remove
     * @returns {Promise<T>} Returns a promise to retrieve the data requested
     */
    read(tableName: string, id: string|number): Promise<T>;

    /**
     * @method readByUuid Gets all entries from the database corresponding to the
     * Uuid
     * @param tableName The name of the table to perform actions on
     * @param uuid The uuid to query by
     * @returns {Promise<T[]>} Returns a promise to retrieve the data requested
     */
    readByUuid(tableName: string, uuid: string): Promise<T[]>;

    /**
     * @method readAll Reads all rows from the table specified
     * @param {string} tableName The table to be read from
     * @returns {Promise<T[]>} A promise that holds the return value
     */
    readAll(tableName: string): Promise<T[]>;

    /**
     * @method readByPage Gets the result on the page specified
     * @param tableName The table to be read from
     * @param pageInfo The requested page and the number of items to be returned
     * from the apge
     * @returns {Promise<T>} Returns a promise to retrieve the data requested
     */
    readByPage(tableName: string, pageInfo: PageInfo): Promise<T[]>;
}
