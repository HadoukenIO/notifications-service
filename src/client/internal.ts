/**
 * @hidden
 */

/**
 * File contains types used to communicate between client and provider.
 *
 * These types are a part of the client, but are not required by applications wishing to interact with the service.
 * This file is excluded from the public-facing TypeScript documentation.
 */

import {NotificationActionResult} from './actions';
import {EventRouter} from './EventRouter';
import {eventEmitter} from './connection';

import {NotificationOptions, Notification, ActionTrigger, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent} from './index';

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

/**
 * The identity of the main application window of the service provider
 */
export const SERVICE_IDENTITY = {
    uuid: 'notifications-service',
    name: 'notifications-service'
};

/**
 * Name of the IAB channel use to communicate between client and provider
 */
export const SERVICE_CHANNEL = 'of-notifications-service-v1';

export const enum APITopic {
    CREATE_NOTIFICATION = 'create-notification',
    CLEAR_NOTIFICATION = 'clear-notification',
    GET_APP_NOTIFICATIONS = 'fetch-app-notifications',
    CLEAR_APP_NOTIFICATIONS = 'clear-app-notifications',
    TOGGLE_NOTIFICATION_CENTER = 'toggle-notification-center'
}

export type API = {
    [APITopic.CREATE_NOTIFICATION]: [CreatePayload, NotificationInternal];
    [APITopic.CLEAR_NOTIFICATION]: [ClearPayload, boolean];
    [APITopic.CLEAR_APP_NOTIFICATIONS]: [undefined, number];
    [APITopic.GET_APP_NOTIFICATIONS]: [undefined, NotificationInternal[]];
    [APITopic.TOGGLE_NOTIFICATION_CENTER]: [undefined, void];
};

export type Events = NotificationActionEvent | NotificationClosedEvent | NotificationCreatedEvent;

export type TransportMappings<T> =
    T extends NotificationActionEvent ? NotificationActionEventTransport :
    never;
export type TransportMemberMappings<T> =
    T extends Notification ? NotificationInternal :
    T;

export interface CreatePayload extends Omit<NotificationOptions, 'date'> {
    date?: number;
}

export interface NotificationInternal extends Omit<Notification, 'date'> {
    date: number;
}

export interface ClearPayload {
    id: string;
}

export interface NotificationActionEventTransport {
    type: 'notification-action';
    notification: Readonly<NotificationInternal>
    result: NotificationActionResult;
    trigger: ActionTrigger;

    // Following are present only if trigger is `CONTROL`
    controlSource?: 'buttons';  // Additional sources will be added in future release
    controlIndex?: number;      // The index of the originating control, within notification[controlSource]
}

let eventHandler: EventRouter<Events>|null;

export function getEventRouter(): EventRouter<Events> {
    if (!eventHandler) {
        eventHandler = new EventRouter(eventEmitter);
    }

    return eventHandler;
}
