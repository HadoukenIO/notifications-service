import {Notification} from '../../client/model/Notification';

export interface INotification extends Notification {
    name: string;
    uuid: string;
}