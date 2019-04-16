
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
