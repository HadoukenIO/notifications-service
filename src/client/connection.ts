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
import { ChannelClient } from 'openfin/_v2/api/interappbus/channel/client';

import {APITopic, SERVICE_CHANNEL, API} from './internal';
import { NotificationEvent } from './models/NotificationEvent';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

/**
 * Defines all events that are fired by the service. 
 * 
 * Currently only one type, but leaving this here to match the service pattern and 
 * in case others are needed in future.
 */
export type NotificationsEvent = NotificationEvent;

/**
 * The event emitter to emit events received from the service.  All addEventListeners will tap into this.
 */
export const eventEmitter = new EventEmitter();

/**
 * Promise to the channel object that allows us to connect to the client
 */
export const channelPromise: Promise<ChannelClient> = typeof fin === 'undefined' ?
    Promise.reject('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.') :
    fin.InterApplicationBus.Channel.connect(SERVICE_CHANNEL, {payload: {version: PACKAGE_VERSION}}).then((channel: ChannelClient) => {
        // Register service listeners
        channel.register('WARN', (payload: any) => console.warn(payload));  // tslint:disable-line:no-any
        channel.register('event', (event: NotificationsEvent) => {
            eventEmitter.emit(event.type, event);
        });
        // Any unregistered action will simply return false
        channel.setDefaultAction(() => false);

        return channel;
    });

/**
 * Wrapper around service.dispatch to help with type checking
 */
export async function tryServiceDispatch<T extends APITopic>(action: T, payload: API[T][0]): Promise<API[T][1]> {
    const channel: ChannelClient = await channelPromise;
    return channel.dispatch(action, payload) as Promise<API[T][1]>;
}