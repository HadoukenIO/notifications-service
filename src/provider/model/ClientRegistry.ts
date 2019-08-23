import {Identity} from 'openfin/_v2/main';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {injectable, inject} from 'inversify';
import {Signal} from 'openfin-service-signal';

import {APITopic, Events} from '../../client/internal';
import {Inject} from '../common/Injectables';

import {APIHandler} from './APIHandler';
import {CollectionMap, Database} from './database/Database';

export type StoredApplication = ProgrammaticApplication | ManifestApplication;

type ProgrammaticApplication = {
    type: 'programmatic';
    id: string;
    initialOptions: ApplicationOption;
    parentUuid: string;
}

type ManifestApplication = {
    type: 'manifest';
    id: string;
    manifestUrl: string;
}

/**
 * Client registry is responsible for keeping track of active clients, storing information about them
 * and re-launching them when requested by other modules. Is intended to be used solely by EventPump.
 */
@injectable()
export class ClientRegistry {
    public readonly onClientHandshake: Signal<[Identity]> = new Signal();

    private readonly _apiHandler: APIHandler<APITopic, Events>;
    private readonly _database: Database;
    private _activeClients: Identity[] = [];

    constructor(@inject(Inject.API_HANDLER) apiHandler: APIHandler<APITopic, Events>, @inject(Inject.DATABASE) database: Database) {
        this._apiHandler = apiHandler;
        this._apiHandler.onConnection.add(this.onClientConnection, this);
        this._apiHandler.onDisconnection.add(this.removeActiveClient, this);
        this._database = database;
    }

    /**
     * Launches the app with specified identity if the start-up information about it was stored previously.
     *
     * @param appUuid Uuid of target client.
     */
    public async tryLaunchApplication(appUuid: string): Promise<void> {
        const isRunning = await fin.Application.wrapSync({uuid: appUuid}).isRunning();
        if (!isRunning) {
            const collection = this._database.get(CollectionMap.APPLICATIONS);
            const storedApplication = await collection.get(appUuid);
            if (storedApplication) {
                try {
                    if (storedApplication.type === 'manifest') {
                        await fin.Application.startFromManifest(storedApplication.manifestUrl);
                    } else {
                        await fin.Application.start(storedApplication.initialOptions);
                    }
                } catch (error) {
                    console.error(error.message);
                }
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
        const info = await fin.Application.wrapSync(app).getInfo();
        const isProgrammatic: boolean = !!info.parentUuid;
        const entry: StoredApplication = isProgrammatic ? {
            type: 'programmatic',
            id: app.uuid,
            initialOptions: info.initialOptions as ApplicationOption,
            parentUuid: info.parentUuid!
        } : {
            type: 'manifest',
            id: app.uuid,
            manifestUrl: info.manifestUrl
        };
        const collection = this._database.get(CollectionMap.APPLICATIONS);
        await collection.upsert(entry);
    }

    private removeActiveClient(client: Identity): void {
        this._activeClients = this._activeClients.filter(activeClient => activeClient.uuid !== client.uuid || activeClient.name !== client.name);
    }
}
