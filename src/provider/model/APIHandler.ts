import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';
import {Identity} from 'openfin/_v2/main';
import {injectable} from 'inversify';
import {Signal} from 'openfin-service-signal';

import {SERVICE_CHANNEL} from '../../client/internal';
import {Targeted, Transport, EventSpecification} from '../../client/EventRouter';

/**
 * Semantic type definition.
 *
 * Whilst not enforceable via TypeScript, wherever this type is used it is expected that a string-based enum will be
 * used as the source of that string.
 */
type Enum = string;

/**
 * Defines a tuple that stores the payload and return type of an API method.
 *
 * The first element will be an interface containing the "payload" of the API - an object containing any parameters
 * that need to be passed from client to provider.
 *
 * The second element is the return type of the API - the type (possibly `void`) that is passed from the provider back
 * to the client.
 */
export type APIDefinition = [unknown, unknown];

/**
 * Defines the external API of the service. This is a mapping of method identifiers to `APIDefinition` tuples.
 *
 * The keys of this mapping are the string 'topic' values that are used to communicate via the IAB Channel.
 */
export type APISpecification<T extends Enum> = {
    [key in T]: APIDefinition;
};

/**
 * Given an entry from an APISpecification, defines the function signature of a callback that is can be registered to
 * handle that API call.
 */
export type APIAction<T extends APIDefinition> = (payload: T[0], source: ProviderIdentity) => T[1] | Promise<T[1]>;

/**
 * Defines an object that contains a callback for each API method.
 *
 * The signature of each method must match the payload and return type defined in the `T` API specification.
 */
export type APIImplementation<T extends Enum, S extends APISpecification<T>> = {
    [K in T]: APIAction<S[K]>;
};

/**
 * Generic client/provider interaction handler.
 *
 * @typeparam T Defines API topics. An enum that defines each available function call.
 * @typeparam E Defines the events that can be sent from provider to client. Should be a union of all `<X>Event` objects.
 */
@injectable()
export class APIHandler<T extends Enum, E extends EventSpecification> {
    private _providerChannel!: ChannelProvider;
    public readonly onConnection: Signal<[Identity]> = new Signal();
    public readonly onDisconnection: Signal<[Identity]> = new Signal();

    public get channel(): ChannelProvider {
        return this._providerChannel;
    }

    public isClientConnection(identity: Identity): boolean {
        return this._providerChannel.connections.some((conn: Identity) => {
            return identity.uuid === conn.uuid && identity.name === conn.name;
        });
    }

    public getClientConnections(): Identity[] {
        return this._providerChannel.connections;
    }

    public async dispatchMessage<S extends APISpecification<T>, K extends T>(identity: Identity, action: K, payload: S[K][0]): Promise<S[K][1]> {
        return this._providerChannel.dispatch(identity, action, payload);
    }

    public async dispatchEvent<T extends E>(targetWindow: Identity, eventTransport: Targeted<Transport<T>>): Promise<void> {
        return this._providerChannel.dispatch(targetWindow, 'event', eventTransport);
    }

    public async publishMessage<S extends APISpecification<T>, K extends T>(action: K, payload: S[K][0]): Promise<S[K][1]> {
        return this._providerChannel.publish(action, payload);
    }

    public async publishEvent<T extends E>(eventTransport: Targeted<Transport<T>>): Promise<void> {
        return Promise.all(this._providerChannel.publish('event', eventTransport)).then(() => {});
    }

    public async registerListeners<S extends APISpecification<T>>(actionHandlerMap: APIImplementation<T, S>): Promise<void> {
        const providerChannel: ChannelProvider = this._providerChannel = await fin.InterApplicationBus.Channel.create(SERVICE_CHANNEL);

        providerChannel.onConnection(this.onConnectionHandler.bind(this));
        providerChannel.onDisconnection(this.onDisconnectionHandler.bind(this));

        for (const action in actionHandlerMap) {
            if (actionHandlerMap.hasOwnProperty(action)) {
                this._providerChannel.register(action, actionHandlerMap[action]);
            }
        }
    }

    // TODO?: Remove the need for this any by defining connection payload type?
    private onConnectionHandler(app: Identity, payload?: any): void {
        if (payload && payload.version && payload.version.length > 0) {
            console.log(`connection from client: ${app.name}, version: ${payload.version}`);
        } else {
            console.log(`connection from client: ${app.name}, unable to determine version`);
        }
        // The 'onConnection' callback fires *just before* the channel is ready.
        // Delaying the firing of our signal slightly, to ensure client is definitely contactable.
        setImmediate(() => {
            this.onConnection.emit(app);
        });
    }

    private onDisconnectionHandler(app: Identity): void {
        this.onDisconnection.emit(app);
    }
}
