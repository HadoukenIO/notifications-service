import {Identity} from 'openfin/_v2/main';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {injectable, inject} from 'inversify';
import {Signal} from 'openfin-service-signal';

import {APITopic, Events} from '../../client/internal';
import {Inject} from '../common/Injectables';

import {APIHandler} from './APIHandler';
import {clientInfoStorage} from './Storage';

type AppInitData = ApplicationOption | string;

@injectable()
export class ClientHandler {
    private _apiHandler!: APIHandler<APITopic, Events>;

    private _activeClients: Identity[] = [];
    public readonly onClientHandshake: Signal<[Identity]> = new Signal();

    constructor(@inject(Inject.API_HANDLER) apiHandler: APIHandler<APITopic, Events>) {
        this._apiHandler = apiHandler;
        this._apiHandler.onConnection.add(this.onClientConnect, this);
        this._apiHandler.onDisconnection.add(this.onClientDisconnection, this);
    }

    public tryLaunchApplication(app: Identity): void {
        fin.Application.wrapSync(app).isRunning().then(running => {
            if (!running) {
                clientInfoStorage.getItem<AppInitData>(app.uuid, (error: any, value: AppInitData) => {
                    if (error) {
                        // this shouldn't happen.
                        console.log('Could not find application initialization data for the application with uuid ' + app.uuid + ' in the database.');
                    } else {
                        (typeof value === 'string') ? fin.Application.startFromManifest(value) : fin.Application.start(value);
                    }
                });
            }
        });
    }

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

    public onClientConnect(app: Identity): void {
        fin.Application.wrapSync(app).getInfo().then(info => {
            clientInfoStorage.setItem<AppInitData>(app.uuid, info.parentUuid ? info.initialOptions as ApplicationOption : info.manifestUrl);
        });
    }

    public onClientDisconnection(app: Identity): void {
        this.onRemoveEventListener('notification-action', app);
    }
}
