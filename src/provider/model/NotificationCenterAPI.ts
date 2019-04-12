import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {INotification} from './INotification';
import {SenderInfo} from '../../client/model/Notification';

export interface NotificationCenterEventMap {
    'notificationCreated': INotification & SenderInfo;
    'notificationCleared': INotification & SenderInfo;
    'appNotificationsCleared': SenderInfo;
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