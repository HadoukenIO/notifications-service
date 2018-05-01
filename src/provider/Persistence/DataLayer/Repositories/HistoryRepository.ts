import { IDatastore } from '../IDatastore';
import { Notification } from '../../../../Shared/Models/Notification';
import { ISenderInfo } from '../../../../provider/Models/ISenderInfo';
import { PageInfo } from '../../Models/PageInfo';
import { VoidResult, ReturnResult } from '../../../../Shared/Models/Result';
import { Repository } from './Repository';
import { Entity } from '../../../../Shared/Models/Entity';

//Shorthand for the intersection-type stored in the repositry
type DataType = Notification & ISenderInfo;

/**
 * @class Repository for history of notification
 */
export class HistoryRepository extends Repository<DataType> {

    /**
     * @constructor Constructor
     * @param {IDatastore} datastore The low level database layer
     */
    constructor(datastore: IDatastore<DataType>) {
        super(datastore, 'history');
    }

    /**
     * @method getTableName return the table name
     * @returns {string} The name of the table
     * @public
     */
    public get getTableName() {
        return super.getTableName;
    }

    /**
     * @method create Creates a notification in the database
     * @param {INotificationEvent} notification The notification to be saved
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async create(notification: Notification & ISenderInfo): Promise<ReturnResult<DataType>> {
        return await super.genericCreate(notification);
    }

    /**
     * @method getAll Gets all notifications in the database
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getAll(): Promise<ReturnResult<DataType[]>> {
        return await super.genericGetAll();
    }

    /**
     * @method getById Retrieves the notification corresponding to that Id
     * @param id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getById(id: string): Promise<ReturnResult<DataType>> {
        return await super.genericGetById(id);
    }

    /**
     * @method getByUuid Retrieves all notifications given a uuid
     * @param uuid THe uuid of the app
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getByUuid(uuid: string): Promise<ReturnResult<DataType[]>> {
        const result = await this.mDataStore.readByUuid(this.TABLENAME, uuid);

        if (result == null) {
            return {
                success: false,
                errorMsg: 'Could not retrieve by uuid: ' + uuid,
                value: null
            };
        }

        return {
            success: true,
            value: result
        };
    }

    /**
     * @method remove Remove a notification from the history store
     * @param {string} id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async remove(id: string): Promise<VoidResult> {
        return await super.genericRemove(id);
    }

    /**
     * @method removeAll Removes all notifications fomr the history store
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async removeAll(): Promise<VoidResult> {
        return await super.genericRemoveAll();
    }

    /**
     * @method removeByUuid Removes all notification related to a specific application
     * @param {string} uuid The uuid of the application
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async removeByUuid(uuid: string): Promise<VoidResult> {
        if (!uuid) {
            console.error('No uuid was supplied');
            return;
        }

        const result = await this.mDataStore.removeByUuid(this.TABLENAME, uuid);

        if (!result) {
            return {
                success: result,
                errorMsg: 'Could not remove all entries in the database with the given uuid: ' + uuid
            };
        }

        return {
            success: result
        };
    }

    /**
     * @method update Updates a notification in the history store
     * @param updatedNotification The updated notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async update(updatedNotification: Notification & ISenderInfo): Promise<ReturnResult<DataType>> {
        return await super.genericUpdate(updatedNotification);
    }

    /**
     * @method getByPage Gets the results depending on the page
     * @param {PageInfo} pageInfo Metadata around the number of items on a page and the page number
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    public async getByPage(pageInfo: PageInfo): Promise<ReturnResult<DataType[]>> {
        return await super.genericGetByPage(pageInfo);
    }
}