import {Entity} from './Entity';
import {NotificationType} from './NotificationTypes';
import { NotificationContext, OptionButton, OptionInput } from '../../client/models/NotificationOptions';

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
    type?: NotificationType;
}