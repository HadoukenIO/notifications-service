import {NotificationContext} from '../../Shared/Models/Notification';
import {OptionButton} from '../../Shared/Models/OptionButton';
import {OptionInput} from '../../Shared/Models/OptionInput';

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