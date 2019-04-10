import {NotificationContext} from './Notification';
import {OptionButton} from './OptionButton';
import {OptionInput} from './OptionInput';

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