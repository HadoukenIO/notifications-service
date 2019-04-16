/**
 * @hidden
 */

/**
 * File contains types used to communicate between client and provider.
 *
 * These types are a part of the client, but are not required by applications wishing to interact with the service.
 * This file is excluded from the public-facing TypeScript documentation.
 */
import {NotificationOptions} from './Notification';
import {Notification} from './Notification';

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
    [APITopic.CREATE_NOTIFICATION]: [CreatePayload, Notification];
    [APITopic.CLEAR_NOTIFICATION]: [ClearPayload, void];
    [APITopic.CLEAR_APP_NOTIFICATIONS]: [undefined, void];
    [APITopic.GET_APP_NOTIFICATIONS]: [undefined, Notification[]];
    [APITopic.TOGGLE_NOTIFICATION_CENTER]: [undefined, void];
};

export interface CreatePayload extends NotificationOptions {
    id: string;
}

export interface ClearPayload {
    id: string;
}
