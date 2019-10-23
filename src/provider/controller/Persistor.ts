import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {CreateNotification, RemoveNotifications, RegisterApplication} from '../store/Actions';
import {ServiceStore} from '../store/ServiceStore';
import {Database, CollectionMap} from '../model/database/Database';
import {DatabaseError} from '../model/Errors';
import {RootState} from '../store/State';
import {Action} from '../store/Store';

@injectable()
export class Persistor {
    private readonly _store: ServiceStore;
    private readonly _database: Database;

    constructor(
        @inject(Inject.STORE) store: ServiceStore,
        @inject(Inject.DATABASE) database: Database
    ) {
        this._store = store;
        this._database = database;
        this._store.onAction.add(this.onAction, this);
    }

    private async onAction(action: Action<RootState>): Promise<void> {
        if (action instanceof CreateNotification) {
            const {notification} = action;
            try {
                await this._database.get(CollectionMap.NOTIFICATIONS).upsert(notification);
            } catch (error) {
                throw new DatabaseError(`Unable to upsert notification ${notification.id}`, error);
            }
        } else if (action instanceof RemoveNotifications) {
            const {notifications} = action;
            const ids = notifications.map((note) => note.id);
            try {
                await this._database.get(CollectionMap.NOTIFICATIONS).delete(ids);
            } catch (error) {
                throw new DatabaseError(`Unable to delete notification ${ids}`, error);
            }
        } else if (action instanceof RegisterApplication) {
            const {application} = action;
            try {
                const collection = this._database.get(CollectionMap.APPLICATIONS);
                await collection.upsert(application);
            } catch (error) {
                throw new DatabaseError(`Unable to upsert Client info ${application.id}`, error);
            }
        }
    }
}
