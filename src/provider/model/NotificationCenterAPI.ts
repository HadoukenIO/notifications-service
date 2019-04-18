import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

import {StoredNotification} from './StoredNotification';

export interface NotificationCenterEventMap {
    'notificationCreated': StoredNotification;
    'notificationCleared': StoredNotification;
    'appNotificationsCleared': {uuid: string};
}

export interface NotificationCenterAPI {
    clickHandler: (payload: StoredNotification) => {};
    buttonClickHandler: (payload: StoredNotification, buttonIndex: number) => {};
    closeHandler: (payload: StoredNotification) => {};
    fetchAllNotifications(): Promise<StoredNotification[]>;
    clearAppNotifications(uuid: string): Promise<number>;
    clearAllNotifications(): Promise<boolean>;
    addEventListener<K extends keyof NotificationCenterEventMap>(event: K, handler: (payload: NotificationCenterEventMap[K], sender: ProviderIdentity) => void):
        void;
}
