"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Repository_1 = require("./Repository");
/**
 * @class Repository for history of notification
 */
class HistoryRepository extends Repository_1.Repository {
    /**
     * @constructor Constructor
     * @param {IDatastore} datastore The low level database layer
     */
    constructor(datastore) {
        super(datastore, 'history');
    }
    /**
     * @method getTableName return the table name
     * @returns {string} The name of the table
     * @public
     */
    get getTableName() {
        return super.getTableName;
    }
    /**
     * @method create Creates a notification in the database
     * @param {INotificationEvent} notification The notification to be saved
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async create(notification) {
        return await super.genericCreate(notification);
    }
    /**
     * @method getAll Gets all notifications in the database
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async getAll() {
        return await super.genericGetAll();
    }
    /**
     * @method getById Retrieves the notification corresponding to that Id
     * @param id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async getById(id) {
        return await super.genericGetById(id);
    }
    /**
     * @method getByUuid Retrieves all notifications given a uuid
     * @param uuid THe uuid of the app
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async getByUuid(uuid) {
        const result = await this.mDataStore.readByUuid(this.TABLENAME, uuid);
        if (result == null) {
            return { success: false, errorMsg: 'Could not retrieve by uuid: ' + uuid, value: null };
        }
        return { success: true, value: result };
    }
    /**
     * @method remove Remove a notification from the history store
     * @param {string} id The id of the notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async remove(id) {
        return await super.genericRemove(id);
    }
    /**
     * @method removeAll Removes all notifications fomr the history store
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async removeAll() {
        return await super.genericRemoveAll();
    }
    /**
     * @method removeByUuid Removes all notification related to a specific
     * application
     * @param {string} uuid The uuid of the application
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async removeByUuid(uuid) {
        if (!uuid) {
            throw new Error('No uuid was supplied');
        }
        const result = await this.mDataStore.removeByUuid(this.TABLENAME, uuid);
        if (!result) {
            return { success: result, errorMsg: 'Could not remove all entries in the database with the given uuid: ' + uuid };
        }
        return { success: result };
    }
    /**
     * @method update Updates a notification in the history store
     * @param updatedNotification The updated notification
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async update(updatedNotification) {
        return await super.genericUpdate(updatedNotification);
    }
    /**
     * @method getByPage Gets the results depending on the page
     * @param {PageInfo} pageInfo Metadata around the number of items on a page and the page number
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async getByPage(pageInfo) {
        return await super.genericGetByPage(pageInfo);
    }
}
exports.HistoryRepository = HistoryRepository;
//# sourceMappingURL=HistoryRepository.js.map