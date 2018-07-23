import {NotificationTypes} from '../../Shared/Models/NotificationTypes';
import {OptionButton} from '../../Shared/Models/OptionButton';

export interface INotification {
    date: number;
    icon: string;
    title: string;
    body: string;
    name: string;
    id: string;
    uuid: string;
    buttons?: OptionButton[];
    type?: NotificationTypes;
}