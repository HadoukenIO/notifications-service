
export interface NotificationOptions {
    id?: string;
    body: string;
    title: string;
    subtitle?: string;
    icon?: string;
    customData?: CustomData;
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
export type CustomData = any;

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
