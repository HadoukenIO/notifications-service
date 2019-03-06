/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./staging/src/provider/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./staging/src/provider/Persistence/DataLayer/IndexedDb.js":
/*!*****************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/IndexedDb.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Sort_1 = __webpack_require__(/*! ../Models/Sort */ "./staging/src/provider/Persistence/Models/Sort.js");
/**
 * @description An IndexedDb implementation implementing the IDatastore
 * interface
 */
class IndexedDb {
    /**
     * @constructor Constructor for IndexedDb
     */
    constructor(db) {
        this.mIndexedDb = db;
    }
    /**
     * @method initialise Initialises the database and does all setup
     * @param {number} dbVersion The version of the database
     * @param {ITable[]} tablesToCreate These are needed in order to recreate the table names should the version be upgraded
     * @public
     */
    initialise(dbVersion, tablesToCreate) {
        if (!dbVersion) {
            console.error('No database name has been passed in');
            return;
        }
        this.mDbOpenRequest = this.mIndexedDb.open('Notifications', dbVersion);
        this.mDbOpenRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            try {
                tablesToCreate.forEach(table => {
                    if (!db.objectStoreNames.contains(table.name)) {
                        const store = db.createObjectStore(table.name, { keyPath: 'id' });
                        if (table.indexName && table.index) {
                            const index = store.createIndex(table.indexName, [table.index]);
                        }
                    }
                });
            }
            catch (err) {
                console.error('error: ', err);
            }
        };
    }
    /**
     * @method create Add an entry into the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} entry Object to insert into the database
     * @public
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    create(tableName, entry) {
        if (!tableName) {
            console.error('No table name has been passed');
            return Promise.reject('No table name has been passed');
        }
        if (!entry) {
            console.error('No entry has been passed');
            return Promise.reject('No entry has been passed');
        }
        return new Promise((resolve, reject) => {
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.add(entry);
            request.onsuccess = (event) => {
                console.log('The entry has been inserted');
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('The entry could not be inserted: ', event);
                resolve(false);
            };
        });
    }
    /**
     * @method remove Deletes an entry in the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} id The id of the entry we want to remove
     * @public
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    remove(tableName, id) {
        if (!tableName) {
            console.error('No table name has been passed');
            return Promise.reject('No table name has been passed');
        }
        if (!id) {
            console.error('No id has been passed');
            return Promise.reject('No id has been passed');
        }
        return new Promise((resolve, reject) => {
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.delete(id);
            request.onsuccess = (event) => {
                console.log('The entry has been deleted');
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('The entry could not be deleted: ', event);
                resolve(false);
            };
        });
    }
    /**
     * @method removeAll Deletes all entries in the database based on the table
     * name
     * @param {string} tableName The name of the table to perform
     * @public
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    removeAll(tableName) {
        if (!tableName) {
            console.error('No table name has been passed');
            return Promise.reject('No table name has been passed');
        }
        return new Promise((resolve, reject) => {
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.clear();
            request.onsuccess = (event) => {
                console.log('The entry has been deleted');
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('The entry could not be deleted: ', event);
                resolve(false);
            };
        });
    }
    /**
     * @method removeByUuid Deletes all entries corresponding to the uuid passed
     * in
     * @param {string} tableName The name of the table to perform
     * @param {string} uuid The uuid of the app
     * @public
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    removeByUuid(tableName, uuid) {
        return new Promise((resolve, reject) => {
            this.readByUuid(tableName, uuid)
                .then((result) => {
                result.forEach((notification) => {
                    this.remove(tableName, notification.id);
                });
                resolve(true);
            })
                .catch((err) => {
                resolve(false);
            });
        });
    }
    /**
     * @method update Update an entry into the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {T} entry Object to update in the database
     * @public
     * @returns {Promise<boolean>} A value of whether it was successfully created or not
     */
    update(tableName, entry) {
        if (!tableName) {
            console.error('No table name has been passed');
            return Promise.reject('No table name has been passed');
        }
        if (!entry) {
            console.error('No entry has been passed');
            return Promise.reject('No entry has been passed');
        }
        return new Promise((resolve, reject) => {
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.put(entry);
            request.onsuccess = (event) => {
                console.log('The entry has been updated');
                resolve(true);
            };
            request.onerror = (event) => {
                console.error('The entry could not be updated: ', event);
                resolve(false);
            };
        });
    }
    /**
     * @method read Reads an entry in the database based on the table name
     * @param {string} tableName The name of the table to perform
     * @param {string} id The id of the entry we want to remove
     * @public
     * @returns {Promise<T>} Returns a promise to retrieve the data requested
     */
    read(tableName, id) {
        return new Promise((resolve, reject) => {
            if (!tableName) {
                reject('No table name has been passed');
            }
            if (!id) {
                reject('No id has been passed in');
            }
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.get(id);
            request.onsuccess = (event) => {
                resolve(request.result);
                console.log('Read has been executed');
            };
            request.onerror = (event) => {
                console.error('The entry could not be updated: ', event);
                resolve(null);
            };
        });
    }
    /**
     * @method readAll Reads all rows from the table specified
     * @param {string} tableName The table to be read form
     * @public
     * @returns {Promise<T>} Returns a promise to retrieve the data requested
     */
    readAll(tableName) {
        return new Promise((resolve, reject) => {
            const result = [];
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readonly');
            const store = transaction.objectStore(tableName);
            const cursorRequest = store.openCursor(null, 'next');
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                }
                else {
                    resolve(result);
                }
            };
            cursorRequest.onerror = (event) => {
                console.error('Could not read from table ' + tableName, event);
                resolve(null);
            };
        });
    }
    /**
     * @method readByUuid Gets all entries from the database corresponding to the
     * Uuid
     * @param tableName The name of the table to perform actions on
     * @param uuid The uuid to query by
     * @public
     * @returns {Promise<T[]>} Returns a promise to retrieve the data requested
     */
    readByUuid(tableName, uuid) {
        return new Promise((resolve, reject) => {
            const result = [];
            const db = this.mDbOpenRequest.result;
            const transaction = db.transaction(tableName, 'readonly');
            const store = transaction.objectStore(tableName);
            const cursorRequest = store.openCursor(null, 'next');
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.uuid === uuid) {
                        result.push(cursor.value);
                    }
                    cursor.continue();
                }
                else {
                    resolve(result);
                }
            };
            cursorRequest.onerror = (event) => {
                console.error('Could not read from table ' + tableName, event);
                resolve(null);
            };
        });
    }
    /**
     * @method readByPage Gets the result on the page specified
     * @param tableName The table to be read from
     * @param pageInfo The requested page and the number of items to be returned
     * from the apge
     * @public
     * @returns {Promise<T[]>} Returns a promise to retrieve the data requested
     */
    readByPage(tableName, pageInfo) {
        return new Promise((resolve, reject) => {
            const result = [];
            this.readAll(tableName).then((notifications) => {
                if (notifications.length === 0) {
                    console.error('There are no entries in the database');
                    resolve(null);
                }
                else {
                    const offset = (pageInfo.pageNumber - 1) * pageInfo.numberOfItems;
                    // Depending on which sorting is applied we will
                    if (pageInfo.sort === Sort_1.Sorts.ascending) {
                        for (let i = offset; i < offset + pageInfo.numberOfItems; i++) {
                            if (notifications[i] != null) {
                                result.push(notifications[i]);
                            }
                        }
                    }
                    else {
                        const reverseLoopOffset = (notifications.length - offset) - 1;
                        for (let i = reverseLoopOffset; i > reverseLoopOffset - pageInfo.numberOfItems; i--) {
                            if (notifications[i] != null) {
                                result.push(notifications[i]);
                            }
                        }
                    }
                    resolve(result);
                }
            });
        });
    }
}
exports.IndexedDb = IndexedDb;
//# sourceMappingURL=IndexedDb.js.map

/***/ }),

/***/ "./staging/src/provider/Persistence/DataLayer/Repositories/HistoryRepository.js":
/*!**************************************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/Repositories/HistoryRepository.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Repository_1 = __webpack_require__(/*! ./Repository */ "./staging/src/provider/Persistence/DataLayer/Repositories/Repository.js");
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

/***/ }),

/***/ "./staging/src/provider/Persistence/DataLayer/Repositories/Repository.js":
/*!*******************************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/Repositories/Repository.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Base repository for all child repositories
 */
class Repository {
    /**
     * @constructor Constructor
     * @param {IDatastore} datastore The low level database layer
     * @param {string} tableName The name of the table the repository will be responsible for
     */
    constructor(datastore, tableName) {
        this.mDataStore = datastore;
        this.TABLENAME = tableName;
    }
    /**
     * @method getTableName return the table name
     * @returns {string} The name of the table
     * @public
     */
    get getTableName() {
        return this.TABLENAME;
    }
    /**
     * @method genericCreate Creates a entity in the database
     * @param {T} entity The entity to be saved into the database
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async genericCreate(entity) {
        if (!entity) {
            throw new Error('No entity was passed');
        }
        const result = await this.mDataStore.create(this.TABLENAME, entity);
        if (!result) {
            return { success: result, errorMsg: 'Could not insert into database: ' + JSON.stringify(entity), value: null };
        }
        return { success: result, value: entity };
    }
    /**
     * @method genericGetAll Gets all entities in the database from the table
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async genericGetAll() {
        const result = await this.mDataStore.readAll(this.TABLENAME);
        if (result == null) {
            return { success: false, errorMsg: `Could not retrieve all entities from the table ${this.TABLENAME}`, value: null };
        }
        return { success: true, value: result };
    }
    /**
     * @method genericGetById Retrieves the entity corresponding to that Id
     * @param {T} id The id of the entity
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async genericGetById(id) {
        if (!id) {
            throw new Error('No id was passed');
        }
        const result = await this.mDataStore.read(this.TABLENAME, id);
        if (!result) {
            return { success: false, errorMsg: `Notification with the id ${id} was not found`, value: null };
        }
        return { success: true, value: result };
    }
    /**
     * @method genericRemove Deletes an entry in the database based on the entity
     * ID
     * @param {tring|number} id The id of the entry we want to remove
     * @protected
     * @returns {Promise<VoidResult>} A value of whether it was successfully removed or not
     */
    async genericRemove(id) {
        if (!id) {
            throw new Error('No id was passed');
        }
        const result = await this.mDataStore.remove(this.TABLENAME, id);
        if (!result) {
            return { success: result, errorMsg: `The given id ${id} could not be removed from the database` };
        }
        return { success: result };
    }
    /**
     * @method genericRemoveAll Removes all notifications fomr the history store
     * @protected
     * @returns {Promise<VoidResult>} Success message and value return back to calling client
     */
    async genericRemoveAll() {
        const result = await this.mDataStore.removeAll(this.TABLENAME);
        if (!result) {
            return { success: result, errorMsg: 'Could not remove all entries in the database' };
        }
        return { success: result };
    }
    /**
     * @method update Updates a notification in the history store
     * @param {T} entity The updated notification
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async genericUpdate(entity) {
        if (!entity) {
            throw new Error('No updated entity has been passed');
        }
        const read = await this.genericGetById(entity.id);
        if (!read.success) {
            return { success: read.success, errorMsg: `No entry matching the id: ${entity.id}, so there is no entry to be updated`, value: null };
        }
        const result = await this.mDataStore.update(this.TABLENAME, entity);
        if (!result) {
            return { success: result, errorMsg: 'The entity could not be updated', value: null };
        }
        return { success: result, value: entity };
    }
    /**
     * @method genericGetByPage Gets the results depending on the page
     * @param {PageInfo} pageInfo Metadata around the number of items on a page and the page number
     * @protected
     * @returns {Promise<ReturnResult>} Success message and value return back to calling client
     */
    async genericGetByPage(pageInfo) {
        if (!pageInfo) {
            throw new Error('No page info has been passed');
        }
        const result = await this.mDataStore.readByPage(this.TABLENAME, pageInfo);
        if (result == null) {
            return { success: false, errorMsg: 'Could not retrieve the page requested', value: null };
        }
        return { success: true, value: result };
    }
}
exports.Repository = Repository;
//# sourceMappingURL=Repository.js.map

/***/ }),

/***/ "./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryEnum.js":
/*!***********************************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryEnum.js ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @description Enum used for repository factory to restrict user from passing
 * invalid values
 */
var Repositories;
(function (Repositories) {
    Repositories["history"] = "history";
    Repositories["settings"] = "settings";
})(Repositories = exports.Repositories || (exports.Repositories = {}));
//# sourceMappingURL=RepositoryEnum.js.map

/***/ }),

/***/ "./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryFactory.js":
/*!**************************************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryFactory.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const IndexedDb_1 = __webpack_require__(/*! ../IndexedDb */ "./staging/src/provider/Persistence/DataLayer/IndexedDb.js");
const HistoryRepository_1 = __webpack_require__(/*! ./HistoryRepository */ "./staging/src/provider/Persistence/DataLayer/Repositories/HistoryRepository.js");
const SettingsRepository_1 = __webpack_require__(/*! ./SettingsRepository */ "./staging/src/provider/Persistence/DataLayer/Repositories/SettingsRepository.js");
/**
 * @class Factory to return repositories.
 */
class RepositoryFactory {
    /**
     * @constructor Constructor Initialises member variables and sets up the
     * database
     * @param datastore The low level database layer
     */
    constructor(datastore) {
        this.mDatastore = datastore;
        const historyRepository = new HistoryRepository_1.HistoryRepository(this.mDatastore);
        const settingsRepository = new SettingsRepository_1.SettingsRepository(this.mDatastore);
        this.mRepositoryStore = { history: historyRepository, settings: settingsRepository };
        const tableNames = [];
        for (const key in this.mRepositoryStore) {
            if (this.mRepositoryStore.hasOwnProperty(key)) {
                const table = { name: this.mRepositoryStore[key]['TABLENAME'], indexName: '', index: '' };
                tableNames.push(table);
            }
        }
        this.mDatastore.initialise(2, tableNames);
    }
    /**
     * @method Returns the singleton instance of itself
     * @returns {RepositoryFactory} Returns an instance of itself
     */
    static get Instance() {
        return this.instance || (this.instance = new this(new IndexedDb_1.IndexedDb(window.indexedDB)));
    }
    /**
     * @method Returns the selected repository
     * @param repositoryName The name of the repository you want to retrieve
     * @returns {Repository} The repository selected
     */
    getRepository(repositoryName) {
        return this.mRepositoryStore[repositoryName];
    }
}
exports.RepositoryFactory = RepositoryFactory;
//# sourceMappingURL=RepositoryFactory.js.map

/***/ }),

/***/ "./staging/src/provider/Persistence/DataLayer/Repositories/SettingsRepository.js":
/*!***************************************************************************************!*\
  !*** ./staging/src/provider/Persistence/DataLayer/Repositories/SettingsRepository.js ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Repository_1 = __webpack_require__(/*! ./Repository */ "./staging/src/provider/Persistence/DataLayer/Repositories/Repository.js");
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

/***/ }),

/***/ "./staging/src/provider/Persistence/Models/Sort.js":
/*!*********************************************************!*\
  !*** ./staging/src/provider/Persistence/Models/Sort.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @description Specifies the type of sorting.
 */
var Sorts;
(function (Sorts) {
    Sorts[Sorts["ascending"] = 0] = "ascending";
    Sorts[Sorts["descending"] = 1] = "descending";
})(Sorts = exports.Sorts || (exports.Sorts = {}));
//# sourceMappingURL=Sort.js.map

/***/ }),

/***/ "./staging/src/provider/index.js":
/*!***************************************!*\
  !*** ./staging/src/provider/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __webpack_require__(/*! ../shared/config */ "./staging/src/shared/config.js");
const NotificationTypes_1 = __webpack_require__(/*! ../shared/Models/NotificationTypes */ "./staging/src/shared/Models/NotificationTypes.js");
const RepositoryEnum_1 = __webpack_require__(/*! ./Persistence/DataLayer/Repositories/RepositoryEnum */ "./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryEnum.js");
const RepositoryFactory_1 = __webpack_require__(/*! ./Persistence/DataLayer/Repositories/RepositoryFactory */ "./staging/src/provider/Persistence/DataLayer/Repositories/RepositoryFactory.js");
const repositoryFactory = RepositoryFactory_1.RepositoryFactory.Instance;
const historyRepository = repositoryFactory.getRepository(RepositoryEnum_1.Repositories.history);
const settingsRepository = repositoryFactory.getRepository(RepositoryEnum_1.Repositories.settings);
let providerChannel;
let serviceUUID;
const centerIdentity = {
    name: 'Notification-Center',
    uuid: '',
    channelId: '',
    channelName: ''
};
/**
 * @description Main entry point to the service
 */
fin.desktop.main(() => {
    registerService();
    const winConfig = {
        name: 'Notification-Center',
        url: 'ui/index.html',
        autoShow: false,
        defaultHeight: 400,
        defaultWidth: 500,
        resizable: false,
        saveWindowState: false,
        defaultTop: 0,
        frame: false,
        icon: 'ui/favicon.ico',
        'showTaskbarIcon': false
    };
    const notificationCenter = new fin.desktop.Window(winConfig, () => {
        console.log('Notification Center created');
    }, (error) => {
        console.log('Error creating Notification Center:', error);
    });
});
/**
 * @method registerService Registers the service and any functions that can be
 * consumed
 */
async function registerService() {
    // Register the service
    const serviceId = fin.desktop.Application.getCurrent().uuid;
    providerChannel = await fin.InterApplicationBus.Channel.create(config_1.CHANNEL_NAME);
    centerIdentity.uuid = serviceUUID = serviceId;
    // handle client connections
    providerChannel.onConnection((app, payload) => {
        if (payload && payload.version && payload.version.length > 0) {
            console.log(`connection from client: ${app.name}, version: ${payload.version}`);
        }
        else {
            console.log(`connection from client: ${app.name}, unable to determine version`);
        }
    });
    // Functions called by the client
    providerChannel.register('create-notification', createNotification);
    providerChannel.register('toggle-notification-center', toggleNotificationCenter);
    // Functions called either by the client or the Notification Center
    providerChannel.register('clear-notification', clearNotification);
    providerChannel.register('fetch-app-notifications', fetchAppNotifications);
    providerChannel.register('clear-app-notifications', clearAppNotifications);
    // Functions called by the Notification Center
    providerChannel.register('notification-clicked', notificationClicked);
    providerChannel.register('notification-button-clicked', notificationButtonClicked);
    providerChannel.register('notification-closed', notificationClosed);
    providerChannel.register('fetch-all-notifications', fetchAllNotifications);
    providerChannel.register('clear-all-notifications', clearAllNotifications);
}
// Send notification created to the UI
const dispatchNotificationCreated = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-created', payload);
    console.log('success', success);
};
// Send notification cleared to the UI
const dispatchNotificationCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-cleared', payload);
    console.log('success', success);
};
// Send app notifications cleared to the UI
const dispatchAppNotificationsCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'app-notifications-cleared', payload);
    console.log('success', success);
};
// Send notification clicked to the Client
const dispatchNotificationClicked = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-clicked', payload);
    console.log('success', success);
};
// Send notification clicked to the Client
const dispatchNotificationButtonClicked = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-button-clicked', payload);
    console.log('success', success);
};
// Send notification closed to the Client
const dispatchNotificationClosed = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-closed', payload);
    console.log('success', success);
};
const dispatchAllNotificationsCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'all-notifications-cleared', payload);
    console.log('success', success);
};
const dispatchToggleNotificationCenter = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'toggle-notification-center', payload);
    console.log('success', success);
};
/**
 * Encodes the Id which currently is the uuid:id
 * @param payload The notification object
 */
function encodeID(payload) {
    return `${payload.uuid}:${payload.id}`;
}
/**
 * @method decodeID This function retrieves the notification Id
 * @param payload The notification object
 */
function decodeID(payload) {
    return payload.id.slice(payload.uuid.length + 1);
}
/**
 * @method createNotification Create the notification and dispatch it to the UI
 * @param {object} payload The contents to be dispatched to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function createNotification(payload, sender) {
    // For testing/display purposes
    console.log('createNotification hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('createNotification', payload, sender);
    const noteType = NotificationTypes_1.TypeResolver(payload);
    const fullPayload = Object.assign({}, payload, sender, { type: noteType });
    const encodedID = encodeID(fullPayload);
    const fullPayloadEncoded = Object.assign({}, fullPayload, { id: encodedID });
    // Manipulate notification data store
    const result = await historyRepository.create(fullPayloadEncoded);
    // Create the notification/toast in the UI
    if (result.success) {
        dispatchNotificationCreated(fullPayload);
    }
    // Return a notification event with the notification context/id to the client
    // that created the notification Or return the payload?
    return result;
}
/**
 * @method toggleNotificationCenter Dispatch the notification center toggle action to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload, sender) {
    // For testing/display purposes
    console.log('toggleNotificationCenter hit');
    console.log('payload', payload);
    console.log('sender', sender);
    // Toggle the notification center
    dispatchToggleNotificationCenter(undefined);
    return '';
}
/**
 * @method clearNotification Tell the UI to delete a specific notification
 * @param {object} payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns {ReturnResult} Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload, sender) {
    // For testing/display purposes
    console.log('clearNotification hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('clearNotification', payload, sender);
    // Grab notificationID from payload. If not present, return error?
    if (!payload.id) {
        return 'ERROR: Must supply a notification ID to clear!';
    }
    const fullPayload = Object.assign({}, payload, sender);
    const encodedID = encodeID(fullPayload);
    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);
    // Delete the notification/toast in UI
    if (result.success) {
        dispatchNotificationCleared(fullPayload);
    }
    return result;
}
/**
 * @method notificationClicked Tell the Client that a notification was clicked
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
function notificationClicked(payload, sender) {
    // For testing/display purposes
    console.log('notificationClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationClicked', payload, sender);
    // Send notification clicked event to uuid with the context.
    dispatchNotificationClicked(payload);
    // TODO: What should we return?
    return 'notificationClicked returned';
}
function notificationButtonClicked(payload, sender) {
    // For testing/display purposes
    console.log('notificationButtonClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationButtonClicked', payload, sender);
    // Send notification clicked event to uuid with the context.
    dispatchNotificationButtonClicked(payload);
    // TODO: What should we return?
    return 'notificationButtonClicked returned';
}
/**
 * @method notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
async function notificationClosed(payload, sender) {
    // For testing/display purposes
    console.log('notificationClosed hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationClosed', payload, sender);
    const encodedID = encodeID(payload);
    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);
    // Send notification closed event to uuid with the context.
    if (result.success) {
        dispatchNotificationCleared(payload);
        dispatchNotificationClosed(payload);
    }
    // TODO: What should we return?
    return result;
}
/**
 * @method fetchAllNotifications Grab all notifications from the Service and
 * return it to the UI.
 * @param {object} payload Not important
 * @param {object} sender Not important.
 */
async function fetchAllNotifications(payload, sender) {
    // For testing/display purposes
    console.log('fetchAllNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('fetchAllNotifications', payload, sender);
    // Grab all notifications from indexeddb.
    const result = await historyRepository.getAll();
    if (result.success) {
        const allNotifications = result.value;
        allNotifications.forEach((notification) => {
            notification.id = decodeID(notification);
        });
        return allNotifications;
    }
    return [];
}
/**
 * @method fetchAppNotifications This allows you to fetch apps via your uuid
 * @param {undefined} payload The payload can contain the uuid
 * @param {ISenderInfo} sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload, sender) {
    // For testing/display purposes
    console.log('fetchAppNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('fetchAppNotifications', payload, sender);
    // If no uuid supplied in the payload, set to the sender's uuid. This is so
    // you can request another app's notification (such as for the Notification
    // Center)
    if (!payload.uuid) {
        payload.uuid = sender.uuid;
    }
    // Grab an app's notifications from indexeddb
    // Send those notifications to the requesting app.
    const result = await historyRepository.getByUuid(payload.uuid);
    if (result.success) {
        const appNotifications = result.value;
        appNotifications.forEach((notification) => {
            console.log('notification', notification);
            notification.id = decodeID(notification);
        });
        result.value = appNotifications;
    }
    return result;
}
/**
 * @method clearAllNotifications Clears all notifications in the database
 * @param {undefined} payload Not important
 * @param {ISenderInfo} sender Not important
 */
async function clearAllNotifications(payload, sender) {
    console.log('clearAllNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('clearAllNotifications', payload, sender);
    // Delete app notifications from indexeddb
    const result = await historyRepository.removeAll();
    if (result.success) {
        dispatchAllNotificationsCleared(payload);
    }
    // TODO: What should we return?
    return 'clearAllNotifications returned';
}
function clearAppNotifications(payload, sender) {
    console.log('clearAppNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('clearAppNotifications', payload, sender);
    // Delete app notifications from indexeddb
    historyRepository.removeByUuid(payload.uuid);
    // Delete the notifications/toasts in UI (TODO: NEED TO REGISTER
    // APP-NOTIFICATIONS-CLEARED IN UI)
    dispatchAppNotificationsCleared(payload);
    // TODO: What should we return?
    return 'clearAppNotifications returned';
}
/**
 * @method testDisplay Displays test html on the service
 * @param {string} action The action that was hit
 * @param {Notification} payload The notification payload
 * @param {ISenderInfo} sender The sender info
 */
function testDisplay(action, payload, sender) {
    document.body.innerHTML = '';
    document.body.innerHTML += `${action} hit <br></br>`;
    document.body.innerHTML += 'PAYLOAD <br></br>';
    const preTagPayload = document.createElement('PRE');
    preTagPayload.textContent = JSON.stringify(payload, null, 4);
    document.body.appendChild(preTagPayload);
    document.body.innerHTML += 'SENDER <br></br>';
    const preTagSender = document.createElement('PRE');
    preTagSender.textContent = JSON.stringify(sender, null, 4);
    document.body.appendChild(preTagSender);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./staging/src/shared/Models/NotificationTypes.js":
/*!********************************************************!*\
  !*** ./staging/src/shared/Models/NotificationTypes.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes["DEFAULT"] = "DEFAULT";
    NotificationTypes["BUTTON"] = "BUTTON";
    NotificationTypes["INLINE"] = "INLINE";
    NotificationTypes["INLINEBUTTON"] = "INLINEBUTTON";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
function TypeResolver(payload) {
    const button = typeof payload.buttons === 'object' && payload.buttons.length > 0 ? true : false;
    const inline = typeof payload.inputs === 'object' && payload.inputs.length > 0 ? true : false;
    let type = NotificationTypes.DEFAULT;
    if (button && !inline) {
        type = NotificationTypes.BUTTON;
    }
    else if (!button && inline) {
        type = NotificationTypes.INLINE;
    }
    else if (button && inline) {
        type = NotificationTypes.INLINEBUTTON;
    }
    return type;
}
exports.TypeResolver = TypeResolver;
//# sourceMappingURL=NotificationTypes.js.map

/***/ }),

/***/ "./staging/src/shared/config.js":
/*!**************************************!*\
  !*** ./staging/src/shared/config.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNEL_NAME = 'of-notifications-service-v1';
//# sourceMappingURL=config.js.map

/***/ })

/******/ });
//# sourceMappingURL=provider.js.map