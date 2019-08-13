import {injectable, inject} from 'inversify';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {Identity} from 'openfin/_v2/main';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

import {Inject} from '../common/Injectables';
import {APITopic, Events} from '../../client/internal';
import {Transport, Targeted} from '../../client/EventRouter';
import {AsyncInit} from '../controller/AsyncInit';
import {NotificationActionEvent} from '../../client';

import {APIHandler} from './APIHandler';
import {clientInfoStorage} from './Storage';

type AppInitData = ApplicationOption | string;
type DeferrableEvent = Targeted<Transport<NotificationActionEvent>>;
type DeferredEvent = {target: Identity, event: DeferrableEvent};

@injectable()
export class EventPump extends AsyncInit {
    @inject(Inject.API_HANDLER)
    private _apiHandler!: APIHandler<APITopic, Events>;

    private _deferredEvents: DeferredEvent[] = [];

    private _activeClients: Identity[] = [];

    protected async init() {
        this._apiHandler.onConnection.add(this.onClientConnect, this);
        this._apiHandler.onDisconnection.add(this.onClientDisconnection, this);
    }

    public async push<T extends Events>(target: Identity, event: Targeted<Transport<T>>): Promise<void> {
        if (event.type !== 'notification-action' || this._activeClients.some(client => client.uuid === target.uuid)) {
            this._apiHandler.dispatchEvent(target, event);
        } else {
            this._deferredEvents.push({target: target, event: event as DeferrableEvent});
            this.tryLaunchApplication(target);
        }
    }

    public async onAddEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this.dispatchDeferredEvents(sender);
            this._activeClients.push(sender);
        }
    }

    public async onRemoveEventListener(eventType: string, sender: Identity): Promise<void> {
        if (eventType === 'notification-action') {
            this._activeClients = this._activeClients.filter(client => client.uuid === sender.uuid && client.name === sender.name);
        }
    }

    private async dispatchDeferredEvents(app: Identity): Promise<void> {
        this._deferredEvents = this._deferredEvents.filter(event => {
            const shouldDispatch: boolean = event.target.uuid === app.uuid;
            if (shouldDispatch) {
                this._apiHandler.dispatchEvent(event.target, event.event);
            }
            return !shouldDispatch;
        });
    }

    private tryLaunchApplication(app: Identity): void {
        if (!fin.Application.wrapSync(app).isRunning()) {
            clientInfoStorage.getItem<AppInitData>(app.uuid, (error: any, value: AppInitData) => {
                if (error) {
                    // this shouldn't happen.
                    console.log('Could not find application initialization data for the application with uuid ' + app.uuid + ' in the database.');
                } else {
                    (typeof value === 'string') ? fin.Application.startFromManifest(value) : fin.Application.start(value);
                }
            });
        }
    }

    private onClientConnect(app: Identity): void {
        fin.Application.wrapSync(app).getInfo().then(info => {
            clientInfoStorage.setItem<AppInitData>(app.uuid, info.parentUuid ? info.initialOptions as ApplicationOption : info.manifestUrl);
        });
    }

    private onClientDisconnection(app: Identity): void {
        this.onRemoveEventListener('notification-action', app);
    }
}
