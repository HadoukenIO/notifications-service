import {Notification} from '../../../../shared/models/Notification';
import {ISenderInfo} from '../../../models/ISenderInfo';

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification&ISenderInfo;
}