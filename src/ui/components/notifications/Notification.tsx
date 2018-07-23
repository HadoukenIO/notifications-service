import * as React from 'react';
import { NotificationTime } from './NotificationTime';
import { INotificationProps } from '../../models/INotificationProps';
import { Fin } from '../../../fin';
declare var fin: Fin;

/**
 * Displays a single notification within the UI
 */
export class Notification extends React.Component<INotificationProps, {}> {
    private handleNotificationClose(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        fin.notifications.closeHandler(this.props.meta);
    }

    public render(): React.ReactNode {
        return (
            <li
                className="notification-item"
                onClick={() => fin.notifications.clickHandler(this.props.meta)}
            >
                <img
                    className="notification-close-x"
                    src="image/shapes/notifications-x.png"
                    alt=""
                    onClick={e => this.handleNotificationClose(e)}
                />
                <NotificationTime date={new Date(this.props.meta.date)} />
                <div className="notification-body">
                    <div className="notification-source">
                        <img
                            src={this.props.meta.icon}
                            className="notification-small-img"
                        />
                        <span className="notification-source-text">
                            {this.props.meta.name}
                        </span>
                    </div>
                    <div className="notification-body-title">
                        {this.props.meta.title}
                    </div>
                    <div className="notification-body-text">
                        {this.props.meta.body}
                    </div>
                </div>
            </li>
        );
    }
}
