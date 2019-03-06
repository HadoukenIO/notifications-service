import {NotificationContext} from '../../shared/models/Notification';
import {OptionButton} from '../../shared/models/OptionButton';
import {OptionInput} from '../../shared/models/OptionInput';

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