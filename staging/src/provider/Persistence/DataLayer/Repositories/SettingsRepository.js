"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Repository_1 = require("./Repository");
/**
 * @class A class that represents the settings table in the datastore
 */
class SettingsRepository extends Repository_1.Repository {
    /**
     * @constructor Constructor
     * @param {IDatastore} datastore The low leve database layer
     */
    constructor(datastore) {
        super(datastore, 'settings');
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
     * @method create Creates the settings in the database
     * @param {Settings} setting The settings to be saved
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async create(setting) {
        const settings = await this.genericGetAll();
        if (!settings.success) {
            return { success: false, errorMsg: settings.errorMsg, value: null };
        }
        if (settings.success && settings.value.length === 1 && this.instanceOf(settings.value[0])) {
            return { success: false, errorMsg: 'There are already settings saved', value: null };
        }
        return await super.genericCreate(setting);
    }
    /**
     * @method getAll Gets the settings in the database
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async get() {
        const result = await super.genericGetAll();
        if (result.value.length < 1) {
            return { success: false, errorMsg: 'There were no settings to be found', value: null };
        }
        return { success: true, value: result.value[0] };
    }
    /**
     * @method remove Removes settings fomr the settings store
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async remove() {
        return await super.genericRemoveAll();
    }
    /**
     * @method update Updates the settings in the settings store
     * @param updatedSettings The updated settings
     * @public
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async update(updatedSettings) {
        return await super.genericUpdate(updatedSettings);
    }
    /**
     * @method instanceOf This is used as a user defined type guard
     * @param {any} object The object we are checking
     * @returns {}
     */
    instanceOf(object) {
        return object.id !== undefined;
    }
}
exports.SettingsRepository = SettingsRepository;
//# sourceMappingURL=SettingsRepository.js.map