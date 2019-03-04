import {ISenderInfo} from '../../../Models/ISenderInfo';
import {Notification} from '../../../../shared/Models/Notification';
import {INotification} from '../INotification';

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification&ISenderInfo;
}