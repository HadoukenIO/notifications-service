import {Notification, SenderInfo} from '../../../../client/models/Notification';


export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification & SenderInfo;
}