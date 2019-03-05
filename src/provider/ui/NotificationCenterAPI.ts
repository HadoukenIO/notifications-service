import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

import {ISenderInfo} from '../Models/ISenderInfo';

import {INotification} from './models/INotification';

export interface NotificationCenterEventMap {
    'notificationCreated': INotification&ISenderInfo;
    'notificationCleared': INotification&ISenderInfo;
    'appNotificationsCleared': ISenderInfo;
}

export interface NotificationCenterAPI {
    clickHandler: (payload: INotification) => {};
    buttonClickHandler: (payload: INotification, buttonIndex: number) => {};
    closeHandler: (payload: INotification) => {};
    fetchAppNotifications(uuid: string): void;
    fetchAllNotifications(): Promise<INotification[]>;
    clearAppNotifications(uuid: string): void;
    clearAllNotifications(payload: INotification[]): void;
    addEventListener<K extends keyof NotificationCenterEventMap>(event: K, handler: (payload: NotificationCenterEventMap[K], sender: ProviderIdentity) => void):
        void;
}