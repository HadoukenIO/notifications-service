import {ISenderInfo} from '../../../provider/Models/ISenderInfo';
import {Notification} from '../../../Shared/Models/Notification';
import {INotification} from '../INotification';

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification&ISenderInfo;
}