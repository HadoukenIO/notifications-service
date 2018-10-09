import {ISenderInfo} from '../provider/Models/ISenderInfo';
import {INotification} from './models/INotification';

export interface NotificationCenterAPI {
    clickHandler: (payload: INotification) => {};
    buttonClickHandler: (payload: INotification, buttonIndex: number) => {};
    closeHandler: (payload: INotification) => {};
    fetchAppNotifications: (uuid: string) => {};
    fetchAllNotifications: () => Promise<INotification[]>;
    clearAppNotifications: (uuid: string) => {};
    clearAllNotifications: (payload: INotification[]) => {};
    addEventListener: (event: string, cb: (payload: INotification|ISenderInfo, sender?: ISenderInfo) => string) => {};
}