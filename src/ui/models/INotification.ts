import {Notification} from '../../Shared/Models/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}