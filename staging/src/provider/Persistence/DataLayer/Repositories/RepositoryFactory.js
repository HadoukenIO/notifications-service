"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IndexedDb_1 = require("../IndexedDb");
const HistoryRepository_1 = require("./HistoryRepository");
const SettingsRepository_1 = require("./SettingsRepository");
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