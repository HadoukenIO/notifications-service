import {injectable, inject} from 'inversify';
import {Identity} from 'openfin/_v2/main';

import {Inject} from '../common/Injectables';
import {APITopic, Events} from '../../client/internal';
import {Transport, Targeted} from '../../client/EventRouter';
import {NotificationActionEvent} from '../../client';

import {APIHandler} from './APIHandler';
import {ClientHandler} from './ClientHandler';

type DeferrableEvent = Targeted<Transport<NotificationActionEvent>>;
type DeferredEvent = {target: Identity, event: DeferrableEvent};

@injectable()
export class EventPump {
    @inject(Inject.API_HANDLER)
    private _apiHandler!: APIHandler<APITopic, Events>;

    private _clientHandler!: ClientHandler;

    private _deferredEvents: DeferredEvent[] = [];

    constructor(@inject(Inject.CLIENT_HANDLER) clientHandler: ClientHandler) {
        this._clientHandler = clientHandler;
        this._clientHandler.onClientHandshake.add(this.dispatchDeferredEvents, this);
    }

    public async push<T extends Events>(target: Identity, event: Targeted<Transport<T>>): Promise<void> {
        if (event.type !== 'notification-action' || this._clientHandler.isAppActive(target)) {
            this._apiHandler.dispatchEvent(target, event);
        } else {
            this._deferredEvents.push({target, event: event as DeferrableEvent});
            this._clientHandler.tryLaunchApplication(target);
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
}
