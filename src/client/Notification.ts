import {Entity} from './Entity';

/**
 * User-defined context data that can be attached to notifications
 */
export type NotificationContext = any;  // tslint:disable-line:no-any

export enum NotificationTypes {
    DEFAULT = 'DEFAULT',
    BUTTON = 'BUTTON',
    INLINE = 'INLINE',
    INLINEBUTTON = 'INLINEBUTTON'
}

/**
 * @description Interface for notification options
 */
export interface Notification extends Entity, NotificationOptions {
    type?: NotificationTypes;
}

/**
 * @description Options for notifications
 */
export interface NotificationOptions {
    body: string;
    title: string;
    subtitle: string;
    icon: string;
    context: NotificationContext;
    date: Date;
    buttons: OptionButton[];
    inputs: OptionInput[];
}

/**
 * @description interface for notification event
 */
export interface NotificationEvent {
    name: string;
    uuid: string;
    id: string;
    context: NotificationContext;
    buttons: OptionButton[];
    buttonIndex: number;
}

/**
 * @description Interface for buttons
 */
export interface OptionButton {
    title: string;
    icon: string;
}

/**
 * @description Interface for inputs
 */
export interface OptionInput {
    name: string;
    placeholder: string;
}

/**
 * @description This gets sent on every request the client makes to the service.
 */
export interface SenderInfo {
    entityType: string;
    name: string;
    parentFrame: string;
    uuid: string;
    channelId: string;
    channelName: string;
}


export interface INotification extends Notification {
    name: string;
    uuid: string;
}

export function resolveType(payload: Notification | Notification & SenderInfo): NotificationTypes {
    const button: boolean = typeof payload.buttons === 'object' && payload.buttons.length > 0 ? true : false;
    const inline: boolean = typeof payload.inputs === 'object' && payload.inputs.length > 0 ? true : false;

    let type: NotificationTypes = NotificationTypes.DEFAULT;

    if (button && !inline) {
        type = NotificationTypes.BUTTON;
    } else if (!button && inline) {
        type = NotificationTypes.INLINE;
    } else if (button && inline) {
        type = NotificationTypes.INLINEBUTTON;
    }

    return type;
}