import * as React from 'react';
import { Notification } from './Notification';
import { INotification } from '../models/INotification';
import { INotificationGroupProps } from '../models/INotificationGroupProps';
import { ISenderInfo } from '../../provider/Models/ISenderInfo';
import { Fin } from "../../fin";
import { eGroupMethod } from './App';

declare var fin: Fin;

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
            const sortedNotifications = this.props.notifications.sort((a: INotification, b: INotification) => {
                const aDate = new Date(a.date);
                const bDate = new Date(b.date);
                return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
            });
            const notificationArray: React.ReactNode[] = sortedNotifications.map(note => <Notification key={[note.uuid, note.id].join(":")} meta={note} />);

            return (
                    <div className="notification-group-wrap">
                        <div className="notification-header">
                            <div className="notification-day">{this.props.name.toUpperCase()}</div>
                            <div className="notification-day-x" onClick={() => this.handleClearAll()}>
                                <img
                                    className="notification-day-x-image"
                                    src="image/shapes/notifications-x.png"
                                    alt=""
                                />
                            </div>
                        </div>
                        <div className="notification-inbox">
                            <ul className="notification-inbox-list">
                                { notificationArray }
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
            fin.notifications.clearAppNotifications(this.props.name);
        } else {
            this.props.notifications.forEach((notification) => {
                fin.notifications.closeHandler(notification);
            });
        }
    }
}
