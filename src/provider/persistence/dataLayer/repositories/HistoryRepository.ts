import {PageInfo} from '../../models/PageInfo';
import {IDatastore} from '../IDatastore';
import {StoredNotification} from '../../../model/StoredNotification';

import {Repository, ReturnResult, VoidResult} from './Repository';

// Shorthand for the intersection-type stored in the repositry
type DataType = StoredNotification;

/**
 * @class Repository for history of notification
 */
export class HistoryRepository extends Repository<DataType> {
    /**
     * @class Constructor
     * @param {IDatastore} datastore The low level database layer
     */
    constructor(datastore: IDatastore<DataType>) {
        super(datastore, 'history');
    }

    /**
     * @function getTableName return the table name
     * @returns {string} The name of the table
     * @public
     */
    public get getTableName() {
        return super.getTableName;
    }

    /**
     * @function create Creates a notification in the database
     * @param {INotificationEvent} notification The notification to be saved
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async create(notification: DataType): Promise<ReturnResult<DataType>> {
        return super.genericCreate(notification);
    }

    /**
     * @function getAll Gets all notifications in the database
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getAll(): Promise<ReturnResult<DataType[]>> {
        return super.genericGetAll();
    }

    /**
     * @function getById Retrieves the notification corresponding to that Id
     * @param id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getById(id: string): Promise<ReturnResult<DataType>> {
        return super.genericGetById(id);
    }

    /**
     * @function getByUuid Retrieves all notifications given a uuid
     * @param uuid THe uuid of the app
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getByUuid(uuid: string): Promise<ReturnResult<DataType[]>> {
        const result = await this.mDataStore.readByUuid(this.TABLENAME, uuid);

        if (result === null) {
            return {success: false, errorMsg: 'Could not retrieve by uuid: ' + uuid, value: null};
        }

        return {success: true, value: result};
    }

    /**
     * @function remove Remove a notification from the history store
     * @param {string} id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async remove(id: string): Promise<VoidResult> {
        return super.genericRemove(id);
    }

    /**
     * @function removeAll Removes all notifications fomr the history store
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async removeAll(): Promise<VoidResult> {
        return super.genericRemoveAll();
    }

    /**
     * @function removeByUuid Removes all notification related to a specific
     * application
     * @param {string} uuid The uuid of the application
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async removeByUuid(uuid: string): Promise<ReturnResult<number>> {
        if (!uuid) {
            throw new Error('No uuid was supplied');
        }

        const result = await this.mDataStore.removeByUuid(this.TABLENAME, uuid);

        if (!result) {
            return {success: false, errorMsg: 'Could not remove all entries in the database with the given uuid: ' + uuid, value: null};
        }

        return {success: true, value: result};
    }

    /**
     * @function update Updates a notification in the history store
     * @param updatedNotification The updated notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async update(updatedNotification: StoredNotification): Promise<ReturnResult<DataType>> {
        return super.genericUpdate(updatedNotification);
    }

    /**
     * @function getByPage Gets the results depending on the page
     * @param {PageInfo} pageInfo Metadata around the number of items on a page and the page number
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getByPage(pageInfo: PageInfo): Promise<ReturnResult<DataType[]>> {
        return super.genericGetByPage(pageInfo);
    }
}
