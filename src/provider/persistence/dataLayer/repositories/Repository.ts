import {Entity} from '../../../../shared/models/Entity';
import {ReturnResult, VoidResult} from '../../../../shared/models/Result';
import {PageInfo} from '../../models/PageInfo';
import {IDatastore} from '../IDatastore';

/**
 * @class Base repository for all child repositories
 */
export abstract class Repository<T extends Entity> {
    /**
     * @property Member variable to hold the datastore
     * @protected
     * @type {IDatastore}
     */
    protected mDataStore: IDatastore<T>;

    /**
     * @property Table name for the repository
     * @constant
     * @protected
     * @type {string}
     */
    protected readonly TABLENAME: string;

    /**
     * @constructor Constructor
     * @param {IDatastore} datastore The low level database layer
     * @param {string} tableName The name of the table the repository will be responsible for
     */
    constructor(datastore: IDatastore<T>, tableName: string) {
        this.mDataStore = datastore;
        this.TABLENAME = tableName;
    }

    /**
     * @method getTableName return the table name
     * @returns {string} The name of the table
     * @public
     */
    protected get getTableName() {
        return this.TABLENAME;
    }

    /**
     * @method genericCreate Creates a entity in the database
     * @param {T} entity The entity to be saved into the database
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    protected async genericCreate(entity: T): Promise<ReturnResult<T>> {
        if (!entity) {
            throw new Error('No entity was passed');
        }

        const result = await this.mDataStore.create(this.TABLENAME, entity);

        if (!result) {
            return {success: result, errorMsg: 'Could not insert into database: ' + JSON.stringify(entity), value: null};
        }

        return {success: result, value: entity};
    }

    /**
     * @method genericGetAll Gets all entities in the database from the table
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    protected async genericGetAll(): Promise<ReturnResult<T[]>> {
        const result = await this.mDataStore.readAll(this.TABLENAME);

        if (result == null) {
            return {success: false, errorMsg: `Could not retrieve all entities from the table ${this.TABLENAME}`, value: null};
        }

        return {success: true, value: result};
    }

    /**
     * @method genericGetById Retrieves the entity corresponding to that Id
     * @param {T} id The id of the entity
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    protected async genericGetById(id: string|number): Promise<ReturnResult<T>> {
        if (!id) {
            throw new Error('No id was passed');
        }

        const result = await this.mDataStore.read(this.TABLENAME, id);

        if (!result) {
            return {success: false, errorMsg: `Notification with the id ${id} was not found`, value: null};
        }

        return {success: true, value: result};
    }

    /**
     * @method genericRemove Deletes an entry in the database based on the entity
     * ID
     * @param {tring|number} id The id of the entry we want to remove
     * @protected
     * @returns {Promise<VoidResult>} A value of whether it was successfully removed or not
     */
    protected async genericRemove(id: string|number): Promise<VoidResult> {
        if (!id) {
            throw new Error('No id was passed');
        }

        const result = await this.mDataStore.remove(this.TABLENAME, id);

        if (!result) {
            return {success: result, errorMsg: `The given id ${id} could not be removed from the database`};
        }

        return {success: result};
    }

    /**
     * @method genericRemoveAll Removes all notifications fomr the history store
     * @protected
     * @returns {Promise<VoidResult>} Success message and value return back to calling client
     */
    protected async genericRemoveAll(): Promise<VoidResult> {
        const result = await this.mDataStore.removeAll(this.TABLENAME);

        if (!result) {
            return {success: result, errorMsg: 'Could not remove all entries in the database'};
        }

        return {success: result};
    }

    /**
     * @method update Updates a notification in the history store
     * @param {T} entity The updated notification
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    protected async genericUpdate(entity: T): Promise<ReturnResult<T>> {
        if (!entity) {
            throw new Error('No updated entity has been passed');
        }

        const read = await this.genericGetById(entity.id);

        if (!read.success) {
            return {success: read.success, errorMsg: `No entry matching the id: ${entity.id}, so there is no entry to be updated`, value: null};
        }

        const result = await this.mDataStore.update(this.TABLENAME, entity);

        if (!result) {
            return {success: result, errorMsg: 'The entity could not be updated', value: null};
        }

        return {success: result, value: entity};
    }

    /**
     * @method genericGetByPage Gets the results depending on the page
     * @param {PageInfo} pageInfo Metadata around the number of items on a page and the page number
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    protected async genericGetByPage(pageInfo: PageInfo): Promise<ReturnResult<T[]>> {
        if (!pageInfo) {
            throw new Error('No page info has been passed');
        }

        const result = await this.mDataStore.readByPage(this.TABLENAME, pageInfo);

        if (result == null) {
            return {success: false, errorMsg: 'Could not retrieve the page requested', value: null};
        }

        return {success: true, value: result};
    }
}