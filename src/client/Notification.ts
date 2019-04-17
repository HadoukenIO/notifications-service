
export interface NotificationOptions {
    notificationId?: string;
    body: string;
    title: string;
    subtitle?: string;
    icon?: string;
    context?: NotificationContext;
    date?: Date;
    buttons?: OptionButton[];
}

export interface OptionButton {
    title: string;
    iconUrl?: string;
}

/**
 * User-defined context data that can be attached to notifications
 */
export type NotificationContext = any;  // tslint:disable-line:no-any

export type Notification = Required<NotificationOptions>;

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
