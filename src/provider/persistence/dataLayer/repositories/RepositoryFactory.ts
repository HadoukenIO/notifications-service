import {Entity} from '../../../../client/models/Entity';
import {Notification, SenderInfo} from '../../../../client/models/Notification';
import {Settings} from '../../../models/Settings';
import {IDatastore} from '../IDatastore';
import {IndexedDb} from '../IndexedDb';

import {HistoryRepository} from './HistoryRepository';
import {IRepositories} from './IRepositories';
import {Repository} from './Repository';
import {SettingsRepository} from './SettingsRepository';

/**
 * @class Factory to return repositories.
 */
export class RepositoryFactory {
    /**
     * @property Holds an instance of itself
     * @private
     * @type {RepositoryFactory}
     */
    private static instance: RepositoryFactory;

    /**
     * @property Handle to the low level database api
     * @private
     * @type {RepositoryFactory}
     */
    private mDatastore: IDatastore<Entity>;

    /**
     * @property Holds the repositories
     * @private
     * @type {IRepositories}
     */
    private mRepositoryStore: IRepositories;

    /**
     * @constructor Constructor Initialises member variables and sets up the
     * database
     * @param datastore The low level database layer
     */
    private constructor(datastore: IDatastore<Entity>) {
        this.mDatastore = datastore;

        const historyRepository = new HistoryRepository(this.mDatastore as IDatastore<Notification & SenderInfo>);
        const settingsRepository = new SettingsRepository(this.mDatastore as IDatastore<Settings>);

        this.mRepositoryStore = {history: historyRepository, settings: settingsRepository};

        const tableNames = [];

        for (const key in this.mRepositoryStore) {
            if (this.mRepositoryStore.hasOwnProperty(key)) {
                const table = {name: this.mRepositoryStore[key]['TABLENAME'], indexName: '', index: ''};

                tableNames.push(table);
            }
        }

        this.mDatastore.initialise(2, tableNames);
    }

    /**
     * @method Returns the singleton instance of itself
     * @returns {RepositoryFactory} Returns an instance of itself
     */
    public static get Instance() {
        return this.instance || (this.instance = new this(new IndexedDb(window.indexedDB)));
    }

    /**
     * @method Returns the selected repository
     * @param repositoryName The name of the repository you want to retrieve
     * @returns {Repository} The repository selected
     */
    public getRepository<T extends Entity>(repositoryName: string): Repository<T> {
        return this.mRepositoryStore[repositoryName] as Repository<T>;
    }
}