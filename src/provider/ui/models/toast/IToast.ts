import {Notification} from '../../../../Shared/Models/Notification';
import {ISenderInfo} from '../../../Models/ISenderInfo';
import {INotification} from '../INotification';

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification&ISenderInfo;
}