/**
 * @hidden
 */

/**
 * File contains vars used to establish service connection between client and provider.
 *
 * These are separated out from 'internal.ts' as including these from provider code will cause the provider to connect
 * to itself.
 *
 * These types are a part of the client, but are not required by applications wishing to interact with the service.
 * This file is excluded from the public-facing TypeScript documentation.
 */
import {EventEmitter} from 'events';

import {ChannelClient} from 'openfin/_v2/api/interappbus/channel/client';
import {DeferredPromise} from 'openfin-service-async';

import {APITopic, SERVICE_CHANNEL, API, SERVICE_IDENTITY, Events} from './internal';
import {EventRouter, Targeted, Transport} from './EventRouter';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

/**
 * The event emitter to emit events received from the service.  All addEventListeners will tap into this.
 */
export const eventEmitter = new EventEmitter();

/**
 * Promise to the channel object that allows us to connect to the client
 */
let channelPromise: Promise<ChannelClient> | null;
const hasDOMContentLoaded = new DeferredPromise<void>();
let hasChannelDisconnectListener = false;
let reconnect = false;

if (typeof fin !== 'undefined') {
    getServicePromise();

    document.addEventListener('DOMContentLoaded', () => {
        hasDOMContentLoaded.resolve();
    });
}

export async function getServicePromise(): Promise<ChannelClient> {
    await hasDOMContentLoaded.promise;
    if (!channelPromise) {
        if (typeof fin === 'undefined') {
            const msg: string = 'fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.';
            channelPromise = Promise.reject(new Error(msg));
        } else if (fin.Window.me.uuid === SERVICE_IDENTITY.uuid && fin.Window.me.name === SERVICE_IDENTITY.name) {
            // Currently a runtime bug when provider connects to itself. Ideally the provider would never import a file
            // that includes this, but for now it is easier to put a guard in place.
            channelPromise = Promise.reject(new Error('Trying to connect to provider from provider'));
        } else {
            const timeoutHandle = window.setTimeout(() => {
                console.warn('Taking a long time to connect to Notifications service. Is the Notifications service running?');
            }, 5000);

            channelPromise = fin.InterApplicationBus.Channel.connect(SERVICE_CHANNEL, {
                wait: true,
                payload: {version: PACKAGE_VERSION}
            }).then((channel: ChannelClient) => {
                window.clearTimeout(timeoutHandle);

                const eventRouter = getEventRouter();

                // Register service listeners
                channel.register('WARN', (payload: unknown) => console.warn(payload));
                channel.register('event', (event: Targeted<Transport<Events>>) => {
                    eventRouter.dispatchEvent(event);
                });
                // Any unregistered action will simply return false
                channel.setDefaultAction(() => false);

                if (!hasChannelDisconnectListener) {
                    channel.onDisconnection(() => {
                        console.warn('Disconnected from Notifications service');
                        reconnect = true;
                        channelPromise = null;
                        setTimeout(() => {
                            console.log('Attempting to reconnect to Notifications service');
                            getServicePromise();
                        }, 300);
                    });
                    hasChannelDisconnectListener = true;
                }

                if (reconnect) {
                    console.log('Reconnected to Notifications service');
                } else {
                    console.log('Connected to Notifications service');
                }

                return channel;
            });
        }
    }

    return channelPromise;
}

/**
 * Wrapper around service.dispatch to help with type checking
 * @param action Action type.
 * @param payload Data payload to send to the provider.
 */
export async function tryServiceDispatch<T extends APITopic>(action: T, payload: API[T][0]): Promise<API[T][1]> {
    const channel: ChannelClient = await getServicePromise();
    return channel.dispatch(action, payload) as Promise<API[T][1]>;
}

let eventRouter: EventRouter<Events>|null;

export function getEventRouter(): EventRouter<Events> {
    if (!eventRouter) {
        eventRouter = new EventRouter(eventEmitter);
    }

    return eventRouter;
}
