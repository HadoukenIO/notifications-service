import {Notification} from '../../../shared/models/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}