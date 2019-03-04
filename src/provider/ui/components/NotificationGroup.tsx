import * as React from 'react';
import { NotificationType } from './NotificationType';
import { INotification } from '../models/INotification';
import { INotificationGroupProps } from '../models/INotificationGroupProps';
import { eGroupMethod } from './App';

import {NotificationCenterAPI} from '../NotificationCenterAPI';
declare var window: Window&{openfin: {notifications: NotificationCenterAPI}};

/**
 * @class NotificationGroup Contains Grouping of Notifications
 */
export class NotificationGroup extends React.Component<INotificationGroupProps, {}> {
    /**
     * @method render Renders A Notification Group
     * @returns ReactNode
     */
    public render(): React.ReactNode {
        if (this.props.notifications.length > 0) {
            const sortedNotifications = this.props.notifications.sort(
                (a: INotification, b: INotification) => {
                    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
                }
            );
            const notificationArray: React.ReactNode[] = sortedNotifications.map(
                note => (
                    <NotificationType
                        key={[note.uuid, note.id].join(':')}
                        meta={note}
                    />
                )
            );

            return (
                <div className="notification-group-wrap">
                    <div className="notification-header">
                        <div className="notification-day">
                            {this.props.name.toUpperCase()}
                        </div>
                        <div
                            className="notification-day-x"
                            onClick={() => this.handleClearAll()}
                        >
                            <img
                                className="notification-day-x-image"
                                src="image/shapes/notifications-x.png"
                                alt=""
                            />
                        </div>
                    </div>
                    <div className="notification-inbox">
                        <ul className="notification-inbox-list">
                            {notificationArray}
                        </ul>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    private handleClearAll(): void {
        if (this.props.groupBy === eGroupMethod.APPLICATION) {
            window.openfin.notifications.clearAppNotifications(this.props.name);
        } else {
            this.props.notifications.forEach(notification => {
                window.openfin.notifications.closeHandler(notification);
            });
        }
    }
}
