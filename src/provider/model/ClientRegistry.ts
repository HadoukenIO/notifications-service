import {Identity} from 'openfin/_v2/main';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {injectable, inject} from 'inversify';
import {Signal} from 'openfin-service-signal';

import {APITopic, Events} from '../../client/internal';
import {Inject} from '../common/Injectables';

import {APIHandler} from './APIHandler';
import {CollectionMap, Database} from './database/Database';

export type StoredApplication = {
    id: string;
    data: ApplicationOption | string
}

/**
 * Client registry is responsible for keeping track of active clients, storing information about them
 * and re-launching them when requested by other modules. Is intended to be used solely by EventPump.
 */
@injectable()
export class ClientRegistry {
    private readonly _apiHandler: APIHandler<APITopic, Events>;
    private readonly _database: Database;

    private _activeClients: Identity[] = [];
    public readonly onClientHandshake: Signal<[Identity]> = new Signal();

    constructor(@inject(Inject.API_HANDLER) apiHandler: APIHandler<APITopic, Events>, @inject(Inject.DATABASE) database: Database) {
        this._apiHandler = apiHandler;
        this._apiHandler.onConnection.add(this.onClientConnection, this);
        this._apiHandler.onDisconnection.add(this.onClientDisconnection, this);
        this._database = database;
    }

    /**
     * Launches the app with specified identity if the start-up information about it was stored previously.
     *
     * @param app Identity of target client.
     */
    public tryLaunchApplication(app: Identity): void {
        fin.Application.wrapSync(app).isRunning().then(async (running) => {
            if (!running) {
                try {
                    const collection = this._database.get(CollectionMap.CLIENTS);
                    const initData = await collection.get(app.uuid);
                    if (initData && initData.data) {
                        if (typeof initData.data === 'string') {
                            await fin.Application.startFromManifest(initData.data);
                        } else {
                            await fin.Application.start(initData.data as ApplicationOption);
                        }
                    } else {
                        throw new Error('Could not find application initialization data for the application with uuid ' + app.uuid + ' in the database.');
                    }
                } catch (error) {
                    this.logError(error);
                }
            }
        });
    }

    /**
     * Decides whether an app is running at the moment.
     *
     * @param app Identity of the app.
     */
    public isAppActive(app: Identity): boolean {
        return this._activeClients.some(client => client.uuid === app.uuid);
    }

    public async onAddEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this._activeClients.push(sender);
            this.onClientHandshake.emit(sender);
        }
    }

    public async onRemoveEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this._activeClients = this._activeClients.filter(client => client.uuid !== sender.uuid || client.name !== sender.name);
        }
    }

    private onClientConnection(app: Identity): void {
        fin.Application.wrapSync(app).getInfo().then(async (info) => {
            try {
                const collection = this._database.get(CollectionMap.CLIENTS);
                await collection.upsert({
                    id: app.uuid,
                    data: info.parentUuid ? info.initialOptions as ApplicationOption : info.manifestUrl
                });
            } catch (error) {
                this.logError(error);
            }
        });
    }

    private onClientDisconnection(app: Identity): void {
        this.onRemoveEventListener('notification-action', app);
    }

    private logError(error: Error): void {
        const e: any = {
            message: error.message,
            ...error
        };
        console.error(error, e);
    }
}
