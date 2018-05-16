import * as React from 'react';
import { NotificationTime } from './NotificationTime';
import { Button } from './Button';
import { INotificationProps } from '../../models/INotificationProps';
import { Fin } from "../../../fin";
declare var fin: Fin;

/**
 * Displays a button notification within the UI
 */
export class ButtonNotification extends React.Component<INotificationProps, {}> {
    public render(): React.ReactNode {
        let buttons = null;
        if (this.props.meta.buttons) {
            buttons = this.props.meta.buttons.map((button, idx) => {
                return <Button key={idx} buttonIndex={idx} meta={this.props.meta} button={button} />
            });
        }

        return (
            <li className="notification-item" onClick={() => fin.notifications.clickHandler(this.props.meta)}>
                <img
                    className="notification-close-x"
                    src="image/shapes/notifications-x.png"
                    alt=""
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        fin.notifications.closeHandler(this.props.meta);
                    }}
                />
                <NotificationTime date={new Date(this.props.meta.date)} />
                <div className="notification-body">
                    <div className="notification-source">
                        <img src={this.props.meta.icon}
                            className="notification-small-img" />
                        <span className="notification-source-text">{this.props.meta.name}</span>
                    </div>
                    <div className="notification-body-title">{this.props.meta.title}</div>
                    <div className="notification-body-text">{this.props.meta.body}</div>
                    <div id='notification-body-buttons'>
                        {buttons}
                    </div>
                </div>
            </li>
        );
    }
}
