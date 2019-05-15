/**
 * This file defines the hidden extensions to the api that the provider uses
 * to communicate with the notifications center, and vice-versa
 *
 * They are included here instead of in client/internal.ts to keep them out
 * of any published client code.
 */

import {API} from '../../client/internal';

import {StoredNotification} from './StoredNotification';

export enum APITopicExtension {
    NOTIFICATION_CLICKED = 'notification-clicked',
    NOTIFICATION_BUTTON_CLICKED = 'notification-button-clicked',
    NOTIFICATION_CLOSED = 'notification-closed'
}

export interface APIExtension extends API {
    [APITopicExtension.NOTIFICATION_CLICKED]: [StoredNotification, void];
    [APITopicExtension.NOTIFICATION_BUTTON_CLICKED]: [StoredNotification & {buttonIndex: number}, void];
    [APITopicExtension.NOTIFICATION_CLOSED]: [StoredNotification, void];
}
