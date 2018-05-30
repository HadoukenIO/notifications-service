import { OptionButton } from "../../Shared/Models/OptionButton";
import { NotificationTypes } from '../../Shared/Models/NotificationTypes';

export interface INotification {
    date: number;
    icon: string;
    title: string;
    body: string;
    name: string;
    id: string;
    uuid: string;
    buttons?: OptionButton[];
    type?: NotificationTypes;
}