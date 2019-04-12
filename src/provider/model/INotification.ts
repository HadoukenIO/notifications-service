import {Notification} from '../../client/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}