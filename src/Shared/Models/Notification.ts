import { OptionButton } from "./OptionButton";
import { OptionInput } from "./OptionInput";
import { Entity } from "./Entity";
import { NotificationTypes } from './NotificationTypes';

/**
 * User-defined context data that can be attached to notifications
 */
export type NotificationContext = any;  //tslint:disable-line:no-any

/**
 * @description Interface for notification options
 */
export interface Notification extends Entity {
    body: string;
    title: string;
    subtitle: string;
    icon: string;
    context: NotificationContext;
    date: Date;
    buttons: OptionButton[];
    inputs: OptionInput[];
    type?: NotificationTypes;
}