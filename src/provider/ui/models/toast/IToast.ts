import {Notification} from '../../../../client/models/Notification';
import {ISenderInfo} from '../../../models/ISenderInfo';

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification&ISenderInfo;
}