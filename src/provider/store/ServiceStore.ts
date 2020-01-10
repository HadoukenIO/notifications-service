import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Database, CollectionMap} from '../model/database/Database';
import {Collection} from '../model/database/Collection';
import {StoredApplication} from '../model/Environment';
import {StoredSetting, SettingsMap} from '../model/StoredSetting';

import {RootState} from './State';
import {Store} from './Store';

@injectable()
export class ServiceStore extends Store<RootState> {
    private static readonly INITIAL_STATE: RootState = {
        notifications: [],
        applications: new Map<string, StoredApplication>(),
        centerVisible: false,
        centerLocked: true,
        centerMuted: false
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

        const applicationsCollection: Collection<StoredApplication> = this._database.get(CollectionMap.APPLICATIONS);
        const applications = new Map<string, StoredApplication>((await applicationsCollection.getAll()).map((application) => [application.id, application]));

        const settingsCollection: Collection<StoredSetting> = this._database.get(CollectionMap.SETTINGS);
        const storedCenterLocked = await settingsCollection.get(SettingsMap.CenterLocked);
        const storedCenterMuted = await settingsCollection.get(SettingsMap.CenterMuted);

        return {
            ...ServiceStore.INITIAL_STATE,
            notifications,
            applications,
            centerLocked: storedCenterLocked ? storedCenterLocked.value as boolean : ServiceStore.INITIAL_STATE.centerLocked,
            centerMuted: storedCenterMuted ? storedCenterMuted.value as boolean : ServiceStore.INITIAL_STATE.centerMuted
        };
    }
}
