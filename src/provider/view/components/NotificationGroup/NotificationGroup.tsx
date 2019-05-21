import * as React from 'react';

import {NotificationCard} from '../NotificationCard/NotificationCard';
import {UIHandlers} from '../../../model/UIHandlers';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';

export interface NotificationGroupProps extends UIHandlers {
    // Group name
    name: string;
    // Notifications in this group
    notifications: StoredNotification[];
}

export function NotificationGroup(props: NotificationGroupProps) {
    const {notifications, name, ...rest} = props;
    const handleClearAll = () => {
        rest.onRemoveNotifications(...notifications);
    };
    return (
        <div className="group">
            <div className="header">
                <div className="title">
                    {props.name.toUpperCase()}
                </div>
                <CloseButton onClick={handleClearAll} />
            </div>
            <ul>
                {
                    notifications.map((notification, i) => {
                        return (
                            <li key={i + notification.id}>
                                <NotificationCard meta={notification} {...rest} />
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    );
}
