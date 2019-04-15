import * as React from 'react';

import {Notification} from '../Notification/Notification';

import {NotificationCenterAPI} from '../../../model/NotificationCenterAPI';
import {GroupingType} from '../../NotificationCenterApp';
import {INotification} from '../../../../client/Notification';
declare var window: Window & {openfin: {notifications: NotificationCenterAPI}};



export interface NotificationGroupProps {
    name: string;
    notifications: INotification[];
    groupBy?: GroupingType;
    id?: number;
}

export function NotificationGroup(props: NotificationGroupProps) {
    function handleClearAll() {
        if (props.groupBy === GroupingType.APPLICATION) {
            window.openfin.notifications.clearAppNotifications(props.name);
        } else {
            props.notifications.forEach(notification => {
                window.openfin.notifications.closeHandler(notification);
            });
        }
    }

    if (props.notifications.length > 0) {
        const sortedNotifications = props.notifications.sort(
            (a: INotification, b: INotification) => {
                return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
            }
        );
        const notificationArray: React.ReactNode[] = sortedNotifications.map(
            note => (
                <Notification key={[note.uuid, note.id].join(':')} meta={note} />
            )
        );

        return (
            <div className="notification-group-wrap">
                <div className="notification-header">
                    <div className="notification-day">
                        {props.name.toUpperCase()}
                    </div>
                    <div
                        className="notification-day-x"
                        onClick={() => handleClearAll()}
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