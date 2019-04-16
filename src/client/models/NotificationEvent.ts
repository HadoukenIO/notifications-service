import {Notification} from './NotificationOptions';

export interface NotificationClickedEvent {
    type: 'notification-clicked';
    notification: Notification;
}
export interface NotificationClosedEvent {
    type: 'notification-closed';
    notification: Notification;
}
export interface NotificationButtonClickedEvent {
    type: 'notification-button-clicked';
    notification: Notification;
    buttonIndex: number;
}

export type NotificationEvent = NotificationClickedEvent | NotificationClosedEvent | NotificationButtonClickedEvent;
