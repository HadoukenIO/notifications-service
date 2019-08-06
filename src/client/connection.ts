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

import {APITopic, SERVICE_CHANNEL, API, SERVICE_IDENTITY, NotificationInternal, Omit} from './internal';

import {NotificationEvent} from './index';

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
 * Type used in the client-provider transport layer. Almost identical to client-facing
 * types with the exception that the notification is a `NotificationInternal` with its
 * date property as a number instead of a JS `Date` object.
 *
 * The event handling code will rehydrate this as a date object before passing it onto
 * any listeners the client may have registered, allowing the client to continue handling
 * any dates as full instances of the `Date` class.
 */
export type EventPayload<T extends NotificationsEvent> = Omit<T, 'notification'> & {notification: NotificationInternal};

/**
 * The event emitter to emit events received from the service.  All addEventListeners will tap into this.
 */
export const eventEmitter = new EventEmitter();

/**
 * Promise to the channel object that allows us to connect to the client
 */
export let channelPromise: Promise<ChannelClient>;

if (fin.Window.me.uuid !== SERVICE_IDENTITY.uuid || fin.Window.me.name !== SERVICE_IDENTITY.name) {
    channelPromise = typeof fin === 'undefined' ?
        Promise.reject(new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.')) :
        fin.InterApplicationBus.Channel.connect(SERVICE_CHANNEL, {payload: {version: PACKAGE_VERSION}}).then((channel: ChannelClient) => {
            // Register service listeners
            channel.register('WARN', (payload: any) => console.warn(payload));
            channel.register('event', (event: EventPayload<NotificationsEvent>) => {
                // Rehydrate the date object on the event payload
                const parsedEvent = {
                    ...event,
                    notification: {
                        ...event.notification,
                        date: new Date(event.notification.date)
                    }
                };

                eventEmitter.emit(event.type, parsedEvent);
            });
            // Any unregistered action will simply return false
            channel.setDefaultAction(() => false);

            return channel;
        });
}

/**
 * Wrapper around service.dispatch to help with type checking
 * @param action Action type.
 * @param payload Data payload to send to the provider.
 */
export async function tryServiceDispatch<T extends APITopic>(action: T, payload: API[T][0]): Promise<API[T][1]> {
    const channel: ChannelClient = await channelPromise;
    return channel.dispatch(action, payload) as Promise<API[T][1]>;
}
