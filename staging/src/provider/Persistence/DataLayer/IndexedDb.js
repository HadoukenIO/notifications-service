"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Sort_1 = require("../Models/Sort");
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