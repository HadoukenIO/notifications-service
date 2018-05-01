import { INotification } from "../INotification";
import { ISenderInfo } from "../../../provider/Models/ISenderInfo";
import { Notification } from "../../../Shared/Models/Notification";

export interface IToast {
    note: fin.OpenFinNotification;
    meta: Notification & ISenderInfo;
}