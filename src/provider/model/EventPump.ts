import {injectable, inject} from 'inversify';
import {Identity} from 'openfin/_v2/main';

import {Inject} from '../common/Injectables';
import {APITopic, Events} from '../../client/internal';
import {Transport, Targeted} from '../../client/EventRouter';
import {NotificationActionEvent} from '../../client';

import {APIHandler} from './APIHandler';
import {ClientRegistry} from './ClientRegistry';

type DeferrableEvent = Targeted<Transport<NotificationActionEvent>>;
type DeferredEvent = {target: Identity, event: DeferrableEvent};

/**
 * Notification event message handler. EventPump internally handles the events added
 * by either dispatching them immediately or deferring the dispatch.
 */
@injectable()
export class EventPump {
    private _apiHandler!: APIHandler<APITopic, Events>;

    private _clientRegistry!: ClientRegistry;

    private _deferredEvents: DeferredEvent[] = [];

    constructor(@inject(Inject.CLIENT_REGISTRY) clientRegistry: ClientRegistry, @inject(Inject.API_HANDLER) apiHandler: APIHandler<APITopic, Events>) {
        this._apiHandler = apiHandler;
        this._clientRegistry = clientRegistry;
        this._clientRegistry.onClientHandshake.add(this.dispatchDeferredEvents, this);
    }

    /**
     * Adds an event to EventPump to be dispatched to the specified client.
     * Type args:
     *   T: Defines the type of event which occured and needs to be passed to the client.
     *
     * @param target Identity of target client.
     * @param event Notification event to be dispatched
     */
    public async push<T extends Events>(target: Identity, event: Targeted<Transport<T>>): Promise<void> {
        if (event.type !== 'notification-action' || this._clientRegistry.isAppActive(target)) {
            this._apiHandler.dispatchEvent(target, event);
        } else {
            this._deferredEvents.push({target, event: event as DeferrableEvent});
            this._clientRegistry.tryLaunchApplication(target);
        }
    }

    /**
     * Dispatches relevant deferred events to a client once a handshake occurs between the provider and the client.
     *
     * @param app Identity of target client.
     */
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
