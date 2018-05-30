import * as React from 'react';
import { Fin } from "../../fin";
import { Notification } from './notifications/Notification';
import { ButtonNotification } from './notifications/ButtonNotification';
import { INotificationProps } from '../models/INotificationProps';
import { NotificationTypes } from '../../Shared/Models/NotificationTypes';

declare var fin: Fin;

/**
 * Determines what type of notification to display in the UI
 */
export class NotificationType extends React.Component<INotificationProps, {}> {
    public render(): React.ReactNode {
       
        switch(this.props.meta.type){
            case NotificationTypes.BUTTON: {
                return <ButtonNotification meta={this.props.meta} />;
            }
            default: {
                return <Notification meta={this.props.meta} />;
            }
        }
    }
}
