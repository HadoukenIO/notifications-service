export interface NotificationOptions {
    body: string;
    title: string;
    subtitle?: string;
    icon?: string;
    context?: NotificationContext;
    date?: Date;
    buttons?: OptionButton[];
    inputs?: OptionInput[];
}

export interface OptionButton {
    title: string;
    iconUrl?: string;
}

export interface OptionInput {
    title: string;
    placeholder?: string;
}
/**
 * User-defined context data that can be attached to notifications
 */
export type NotificationContext = any;  // tslint:disable-line:no-any
