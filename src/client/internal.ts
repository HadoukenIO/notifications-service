/**
 * @hidden
 */

/**
 * File contains types used to communicate between client and provider.
 *
 * These types are a part of the client, but are not required by applications wishing to interact with the service.
 * This file is excluded from the public-facing TypeScript documentation.
 */

import {NotificationActionResult, ActionTrigger} from './actions';
import {ProviderStatus} from './provider';

import {NotificationOptions, Notification, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent} from './index';

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
    TOGGLE_NOTIFICATION_CENTER = 'toggle-notification-center',
    ADD_EVENT_LISTENER = 'add-event-listener',
    REMOVE_EVENT_LISTENER = 'remove-event-listener',
    GET_PROVIDER_STATUS = 'get-provider-status'
}

export interface API {
    [APITopic.CREATE_NOTIFICATION]: [CreatePayload, NotificationInternal];
    [APITopic.CLEAR_NOTIFICATION]: [ClearPayload, boolean];
    [APITopic.CLEAR_APP_NOTIFICATIONS]: [undefined, number];
    [APITopic.GET_APP_NOTIFICATIONS]: [undefined, NotificationInternal[]];
    [APITopic.TOGGLE_NOTIFICATION_CENTER]: [undefined, void];
    [APITopic.ADD_EVENT_LISTENER]: [Events['type'], void];
    [APITopic.REMOVE_EVENT_LISTENER]: [Events['type'], void];
    [APITopic.GET_PROVIDER_STATUS]: [undefined, ProviderStatus];
}

export type Events = NotificationActionEvent | NotificationClosedEvent | NotificationCreatedEvent;

export type TransportMappings<T> =
    T extends NotificationActionEvent ? NotificationActionEventTransport :
        never;
export type TransportMemberMappings<T> =
    T extends Notification ? NotificationInternal :
        T;

export interface CreatePayload extends Omit<NotificationOptions, 'date' | 'expires'> {
    date?: number;
    expires?: number | null;
}

export interface NotificationInternal extends Omit<Notification, 'date' | 'expires'> {
    date: number;
    expires: number | null;
}

export interface ClearPayload {
    id: string;
}

export interface NotificationActionEventTransport {
    type: 'notification-action';
    notification: Readonly<NotificationInternal>;
    result: NotificationActionResult;
    trigger: ActionTrigger;

    // Following are present only if trigger is `ActionTrigger.CONTROL`
    controlSource?: 'buttons';  // Additional sources will be added in future release
    controlIndex?: number;      // The index of the originating control, within notification[controlSource]
}
