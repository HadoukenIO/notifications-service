import {API} from '../../client/internal';

import {StoredNotification} from './StoredNotification';

// These define the hidden extensions to the api
// that are used for comms with the center
export enum APITopicExtension {
    NOTIFICATION_CLICKED = 'notification-clicked',
    NOTIFICATION_BUTTON_CLICKED = 'notification-button-clicked',
    NOTIFICATION_CLOSED = 'notification-closed',
    FETCH_ALL_NOTIFICATIONS = 'fetch-all-notifications',
    CLEAR_ALL_NOTIFICATIONS = 'clear-all-notifications'
}

export interface APIExtension extends API {
    [APITopicExtension.NOTIFICATION_CLICKED]: [StoredNotification, void];
    [APITopicExtension.NOTIFICATION_BUTTON_CLICKED]: [StoredNotification & {buttonIndex: number}, void];
    [APITopicExtension.NOTIFICATION_CLOSED]: [StoredNotification, void];
    [APITopicExtension.FETCH_ALL_NOTIFICATIONS]: [undefined, StoredNotification[]];
    [APITopicExtension.CLEAR_ALL_NOTIFICATIONS]: [undefined, boolean];
}
