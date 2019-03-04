import {NotificationContext} from '../../shared/Models/Notification';
import {OptionButton} from '../../shared/Models/OptionButton';
import {OptionInput} from '../../shared/Models/OptionInput';

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