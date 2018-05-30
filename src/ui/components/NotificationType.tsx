import * as React from 'react';
import { Fin } from "../../fin";
import { Notification } from './notifications/Notification';
import { ButtonNotification } from './notifications/ButtonNotification';
import { INotificationProps } from '../models/INotificationProps';
declare var fin: Fin;

/**
 * Determines what type of notification to display in the UI
 */
export class NotificationType extends React.Component<INotificationProps, {}> {
    public render(): React.ReactNode {
        if (this.props.meta.buttons) {
            return <ButtonNotification meta={this.props.meta} />;
        } else {
            return <Notification meta={this.props.meta} />;
        }
    }
}
