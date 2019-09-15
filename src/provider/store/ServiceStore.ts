import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Database, CollectionMap} from '../model/database/Database';
import {Collection} from '../model/database/Collection';

import {RootState} from './State';
import {Store} from './Store';

@injectable()
export class ServiceStore extends Store<RootState> {
    private static INITIAL_STATE: RootState = {
        notifications: [],
        centerVisible: false,
        centerLocked: false
    };

    private readonly _database: Database;

    constructor(@inject(Inject.DATABASE) database: Database) {
        super(ServiceStore.INITIAL_STATE);
        this._database = database;
    }

    protected async init(): Promise<void> {
        await this._database.initialized;
        this.setState(await this.getInitialState());
    }

    private async getInitialState(): Promise<RootState> {
        const notificationCollection: Collection<StoredNotification> = this._database.get(CollectionMap.NOTIFICATIONS);
        const notifications: StoredNotification[] = await notificationCollection.getAll();

        return Object.assign({}, ServiceStore.INITIAL_STATE, {notifications});
    }
}
