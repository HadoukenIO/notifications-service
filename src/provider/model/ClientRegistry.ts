import {Identity} from 'openfin/_v2/main';
import {injectable, inject} from 'inversify';
import {Signal} from 'openfin-service-signal';

import {APITopic, Events} from '../../client/internal';
import {Inject} from '../common/Injectables';

import {APIHandler} from './APIHandler';
import {CollectionMap, Database} from './database/Database';
import {Environment, StoredApplication} from './Environment';

/**
 * Client registry is responsible for keeping track of active clients, storing information about them
 * and re-launching them when requested by other modules. Is intended to be used solely by EventPump.
 */
@injectable()
export class ClientRegistry {
    public readonly onClientHandshake: Signal<[Identity]> = new Signal();

    private readonly _apiHandler: APIHandler<APITopic, Events>;
    private readonly _database: Database;
    private readonly _environment: Environment;

    private _activeClients: Identity[] = [];

    constructor(
        @inject(Inject.API_HANDLER) apiHandler: APIHandler<APITopic, Events>,
        @inject(Inject.DATABASE) database: Database,
        @inject(Inject.ENVIRONMENT) environment: Environment
    ) {
        this._apiHandler = apiHandler;
        this._apiHandler.onConnection.add(this.onClientConnection, this);
        this._apiHandler.onDisconnection.add(this.removeActiveClient, this);

        this._database = database;
        this._environment = environment;
    }

    /**
     * Launches the app with specified identity if the start-up information about it was stored previously.
     *
     * @param appUuid Uuid of target client.
     */
    public async tryLaunchApplication(appUuid: string): Promise<void> {
        const isRunning = await this._environment.isApplicationRunning(appUuid);

        if (!isRunning) {
            const collection = this._database.get(CollectionMap.APPLICATIONS);
            const storedApplication = await collection.get(appUuid);
            if (storedApplication) {
                await this._environment.startApplication(storedApplication);
            } else {
                console.warn('Could not find application initialization data for the application with uuid ' + appUuid + ' in the database.');
            }
        }
    }

    /**
     * Decides whether an app is running at the moment.
     *
     * @param appUuid Uuid of the app.
     */
    public isAppActive(appUuid: string): boolean {
        return this._activeClients.some(client => client.uuid === appUuid);
    }

    public getAllAppWindows(uuid: string): Identity[] {
        return this._activeClients.filter((client) => {
            return client.uuid === uuid;
        });
    }

    public async onAddEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this._activeClients.push(sender);
            this.onClientHandshake.emit(sender);
        }
    }

    public async onRemoveEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this.removeActiveClient(sender);
        }
    }

    private async onClientConnection(app: Identity): Promise<void> {
        const application: StoredApplication = await this._environment.getApplication(app.uuid);

        const collection = this._database.get(CollectionMap.APPLICATIONS);
        await collection.upsert(application);
    }

    private removeActiveClient(client: Identity): void {
        this._activeClients = this._activeClients.filter(activeClient => activeClient.uuid !== client.uuid || activeClient.name !== client.name);
    }
}
