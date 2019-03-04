import {INotification} from './INotification';

export enum eGroupMethod {
    APPLICATION,
    DATE
}

export interface INotificationGroupProps {
    name: string;
    notifications?: INotification[];
    groupBy?: eGroupMethod;
    id?: number;
}