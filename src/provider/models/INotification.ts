import {Notification} from '../../client/models/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}