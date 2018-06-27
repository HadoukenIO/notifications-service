import { INotification } from './INotification';

export interface INotificationButton {
    buttonTitle: string;
}
export interface INotificationButtonProps {
    meta: INotification;
    buttonIndex: number;
}