import {Notification} from '../../../shared/Models/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}